interface Wiki {
    source: string;
    vars: Record<string, any>;
}

class Page {
    constructor(private pageId: number, private source: string) { }

    getPageId(): number {
        return this.pageId;
    }

    getSource(): string {
        return this.source;
    }
}

export class TextWikiParseInclude {
    private conf = { base: '/path/to/scripts/' };
    private regex = /^\[\[include ([a-zA-Z0-9\s\-:]+?)(\s+.*?)?(?:\]\])$/ims;

    constructor(private wiki: Wiki) { }

    parse(): void {
        let level = 0;
        let oldSource;
        do {
            oldSource = this.wiki.source;
            // console.log("this.wiki.source.match(this.regex)", this.wiki.source.match(this.regex));

            this.wiki.source = this.wiki.source.replace(this.regex, (match, ...matches) => this.process(matches));
            level++;
        } while (oldSource !== this.wiki.source && level < 5);
    }

    private process(matches: string[]): string {
        const [pageName, subs] = matches;
        const cleanedPageName = this.toUnixName(pageName.trim());

        const page = this.getPageFromDb(cleanedPageName);
        // console.log("page", page);

        if (!page) {
            const output = `\n\n[[div class="error-block"]]\nPage to be included ${cleanedPageName} cannot be found!\n[[/div]]\n\n`;
            this.wiki.vars.inclusionsNotExist = { ...this.wiki.vars.inclusionsNotExist, [cleanedPageName]: cleanedPageName };
            return output;
        }

        let output = page.getSource();
        // console.log("output", output);

        if (subs) {
            const subsArray = subs.split('|');
            for (const sub of subsArray) {
                const [varName, value] = sub.split('=').map(s => s.trim());
                if (value && varName && /^[a-z0-9\-_]+$/i.test(varName)) {
                    output = output.replace(new RegExp(`\{\$${varName}\}`, 'g'), value);
                }
            }
        }

        this.wiki.vars.inclusions = { ...this.wiki.vars.inclusions, [page.getPageId()]: page.getPageId() };
        return `${output}`;
    }

    private toUnixName(name: string): string {
        return name.replace(/\s+/g, '_').toLowerCase();
    }

    private getPageFromDb(pageName: string): Page | null {
        if (pageName === 'some-page') {
            return new Page(1, 'This is some page content.');
        }
        if (pageName === 'some-inc-page') {
            return new Page(2, '[[include some-page]]\n[[include some-page]]\n[[include some-page]]\nthis is 3times inc page content.');
        }
        if (pageName === 'self') {
            return new Page(1, '[[include self]]');
        }
        return null;
    }
}