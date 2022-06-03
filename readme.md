# Wikitext Previewer (FTML/Wikidot Web Previewer)
![](https://img.shields.io/github/workflow/status/RTa-technology/ftml-web/deploy?style=flat-square)  
A WebApp to preview FTML, the SCP Foundation's markup language, on the Web.
![image](https://user-images.githubusercontent.com/57354947/170820883-135b74cf-bd3f-4dc3-9611-17fad265a495.png)
> "SCP-173" by Moto42, from the SCP Wiki. Source: https://scp-wiki.wikidot.com/scp-173. Licensed under CC-BY-SA.
## Development

This repository uses pnpm for package management.

Install development dependencies and use
```bash
pnpm install
pnpm run dev
```

## References

* [FTML Blocks documentation](https://github.com/scpwiki/wikijump/blob/develop/ftml/docs/Blocks.md)
* [@vscode-ftml](https://www.npmjs.com/package/@vscode-ftml/ftml-wasm)

## License
Copyright (C) 2022- Zokhoi & other vscode-ftml contributors ([vscode-ftml](https://github.com/Zokhoi/vscode-ftml))

Copyright (C) 2022- RTa-technology & other ftml-web contributors (see AUTHORS.md)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see https://www.gnu.org/licenses/.

## Translate
If you want to help translating Locale Emulator, you can find all strings in

 -  [`index.yaml`](/src/public/locales/index.yaml) in [`src/public/locales/`](/src/public/locales/) folder.
 -  `message.yaml`, `theme.css`, `side.ftml`, `top.ftml` in [`src/public/locales/lang`](/src/public/locales/) folder.

`top.ftml`
```ftml
[[ul]]
[[li]][# Rules][[ul]]
[[li]][[[Site Rules]]][[/li]]
[[/ul]][[/li]]
[[/ul]]
```

```
\s\*\s(.+) => [[li]]$1[[/li]]
```
```
\*\s(.+) => 

[[/ul]][[/li]]
[[/ul]][[ul]]
[[li]]$1[[ul]] 

and Initial 

[[/ul]][[/li]]
[[/ul]] 

at the end
```

If it is not a link, use [# text] to make it a link.

After you translated the above files into your language, please inform me by creating a pull request.


## Acknowledgments 
* [Zokhoi/vscode-ftml](https://github.com/Zokhoi/vscode-ftml)
