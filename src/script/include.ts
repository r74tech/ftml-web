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
    private includedPages: string[] = [];

    constructor(private wiki: Wiki) {
        this.updateIncludedPages();
    }

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
        this.saveIncludedPagesToLocalStorage();
    }

    private async process(matches: string[]): Promise<string> {
        const [pageName, subs] = matches;
        const cleanedPageName = this.toUnixName(pageName.trim());

        // const page = await this.getPageFromDb(cleanedPageName); 
        const cachedPages = this.getCachedPages();
        // console.log('cachedPages:', cachedPages);
        // cachedPagesにpageNameがあれば、pageIdとsourceを取得
        // なければ、GASから取得
        const cachedPage = cachedPages[pageName];
        const page = cachedPage ? new Page(cachedPage.pageId, cachedPage.source) : await this.getPageFromDb(cleanedPageName);

        if (!page) {
            const output = `\n\n[[div class="error-block"]]\nPage to be included ${cleanedPageName} cannot be found!\n[[/div]]\n\n`;
            this.wiki.vars.inclusionsNotExist = { ...this.wiki.vars.inclusionsNotExist, [cleanedPageName]: cleanedPageName };
            return output;
        }

        let output = page.getSource();
        if (subs && output) {
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

    private updateIncludedPages() {
        const regex = /\[\[include ([a-zA-Z0-9\s\-:]+?)(\s+.*?)?\]\]/g;
        let match;
        while ((match = regex.exec(this.wiki.source)) !== null) {
            // this.includedPages.push(match[1].trim()); //重複を削除したい
            const pageName = match[1].trim();
            if (!this.includedPages.includes(pageName)) {
                this.includedPages.push(pageName);
            }
        }
    }

    private saveIncludedPagesToLocalStorage() {
        localStorage.setItem('includedPages', JSON.stringify(this.includedPages));
    }

    static loadIncludedPagesFromLocalStorage(): string[] {
        const savedData = localStorage.getItem('includedPages');
        if (savedData) {
            const savedPages = JSON.parse(savedData);
            if (Array.isArray(savedPages)) {
                return savedPages;
            }
        }
        return [];
    }

    async onEdit(event: Event) {
        const source = (event.target as HTMLTextAreaElement).value;
        // console.log('Source changed:', source);
        this.wiki.source = source; // クラス内のwiki.sourceを更新
        this.updateIncludedPages(); // 引数なしで呼び出し
        await this.checkForNewIncludes();
        this.saveIncludedPagesToLocalStorage();

        // paese()を呼び出し、wiki.sourceを更新
        await this.parse();
    }

    private async checkForNewIncludes() {
        const cachedPages = this.getCachedPages();
        const newIncludes = this.includedPages.filter(page => !cachedPages[page]);
        if (newIncludes.length > 0) {
            await this.fetchPagesFromGAS(newIncludes);
        }
    }

    private async fetchPagesFromGAS(pages: string[]) {
        for (const page of pages) {
            try {
                const data = await getDataFromGAS(page);
                this.cachePage(page, data);
            } catch (error) {
                console.error('Failed to fetch page:', page, error);
            }
        }
    }

    private cachePage(pageName: string, data: any) {
        const cachedPages = this.getCachedPages();
        cachedPages[pageName] = { pageId: data.data.shortId, source: data.data.source }; // オブジェクトをそのまま保存
        localStorage.setItem('cachedPages', JSON.stringify(cachedPages)); // オブジェクトを文字列に変換して保存
    }

    private getCachedPages(): Record<string, { pageId: string; source: string }> {
        const savedData = localStorage.getItem('cachedPages');
        return savedData ? JSON.parse(savedData) : {};
    }

}

