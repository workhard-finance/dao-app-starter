## Fork this template

[Click to generate a project](https://github.com/workhard-finance/dao-app-starter/generate)

## Install dependency

```shell
$ yarn
```

## Configure your DAO info

Wait, if you have not forked WHF yet, please go to the [tutorial page](https://www.workhard.finance/tutorial/fork) and follow the instruction. We recommend you to try the Rinkeby version first and fork on mainnet later. If your DAO's id is 34 you should configture "config.json" file like

```
# src/config.json

{
  "appName": "Your App Name",
  "daoId": 34,
  "projects": {
    "banned": [],
    "featured": []
  },
  "nfts": {
    "banned": [],
    "featured": []
  }
}
```

## Run app on localhost

```
yarn start
```

## Change theme

The easiest way to change theme is using [bootswatch theme](https://bootswatch.com). Go to "src/custom.css" and change the theme name.
```scss
@import "~bootswatch/dist/[theme-name]/variables";
@import "~bootstrap/scss/bootstrap";
@import "~bootswatch/dist/[theme-name]/bootswatch";
```

TBH, we've focused on shipping the product as fast as possible. Template code is buggy and theme support is not clean. We're so much welcome to your contributions on this repo. If you have any interest please [join the discord](https://discord.gg/eYCcusjXUr) and let's have a talk there. (You'll get compensated in COMMIT tokens)

## Deploy

You can use [Vercel](https://vercel.com/) to easily deploy your app.

