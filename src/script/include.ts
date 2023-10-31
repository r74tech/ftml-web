import { getDataFromGAS } from "./helper";

interface Wiki {
    source: string;
    vars: Record<string, any>;
}

class Page {
    constructor(private pageId: string, private source: string) { }

    getPageId(): string {
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

    async parse(): Promise<void> {
        let level = 0;
        let oldSource;
        do {
            oldSource = this.wiki.source;
            const matches = this.regex.exec(this.wiki.source);
            if (matches) {
                const output = await this.process(matches.slice(1));
                this.wiki.source = this.wiki.source.replace(this.regex, output);
            }
            level++;
        } while (oldSource !== this.wiki.source && level <= 10);
    }


    private async process(matches: string[]): Promise<string> {
        const [pageName, subs] = matches;
        const cleanedPageName = this.toUnixName(pageName.trim());


        const page = await this.getPageFromDb(cleanedPageName);
        if (!page) {
            const output = `\n\n[[div class="error-block"]]\nPage to be included ${cleanedPageName} cannot be found!\n[[/div]]\n\n`;
            this.wiki.vars.inclusionsNotExist = { ...this.wiki.vars.inclusionsNotExist, [cleanedPageName]: cleanedPageName };
            return output;
        }

        let output = page.getSource();
        if (subs) {
            const subsArray = subs.split('|');
            for (const sub of subsArray) {
                const [varName, value] = sub.split('=').map(s => s.trim());
                if (value && varName && /^[a-z0-9\-_]+$/i.test(varName)) {
                    output = output.replace(new RegExp(`\{\\$${varName}\}`, 'g'), value);
                }
            }
        }

        this.wiki.vars.inclusions = { ...this.wiki.vars.inclusions, [page.getPageId()]: page.getPageId() };
        return `${output}`;
    }

    private toUnixName(name: string): string {
        // return name.replace(/\s+/g, '_').toLowerCase();
        return name.replace(/\s+/g, '_');
    }

    private async getPageFromDb(pageName: string): Promise<Page | null> {
        try {
            const data = await getDataFromGAS(pageName);
            return new Page(data.data.shortId, data.data.source);
        } catch (error) {
            console.error('Failed to get page from DB:', error);
            return null;
        }
    }
}