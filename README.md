# Finalnd crypto FIFO tax calculator
> Calculate taxes for the Finnish government from your crypto tradings

Finnish government has [rules for taxation of different crypto
trades](https://www.vero.fi/en/detailed-guidance/guidance/48411/taxation-of-virtual-currencies3/).
The rules are quite complex compared to how easy it is to trade coins, so this
project aims to build an easy-to-use and free tool so you know to pay correct
amount of taxes.

## Getting started

At the moment this project implements the examples from vero.fi as unit tests.
You can run the unit tests with `yarn test`.

Later this will be probably deployed as a webapp

## Developing

First run: Install dependencies with `yarn`.

After that the development is basic TDD using:

```
yarn test --watch
```

This watches all changed files automatically for changes and re-runs appropriate
tests when necessary. See `src/` folder for both unit tests and implementation.

## Features

This project aims to be
* Zero trust / low trust
  * User data encrypted by default
  * Only optional to use direct marketplace APIs, fallback to use .csv imports
* Free
* Implement the vero spec as good as possible

## Contributing

This is a free and voluntary open source project. Pull requests are warmly
welcome. If you'd like to contribute, please fork the repository and use a
feature branch.

If you find any bugs or want to propose a new feature, please open a Github
issue to discuss.

## Licensing

The code in this project is licensed under MIT license.
