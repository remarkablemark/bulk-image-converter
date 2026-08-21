# bulk-image-converter

[![build](https://github.com/remarkablemark/bulk-image-converter/actions/workflows/build.yml/badge.svg)](https://github.com/remarkablemark/bulk-image-converter/actions/workflows/build.yml)
[![test](https://github.com/remarkablemark/bulk-image-converter/actions/workflows/test.yml/badge.svg)](https://github.com/remarkablemark/bulk-image-converter/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/remarkablemark/bulk-image-converter/graph/badge.svg?token=1bLWyvZeUY)](https://codecov.io/gh/remarkablemark/bulk-image-converter)

🖼️ Convert multiple images in your browser. No uploads, no server, fully client-side.

- [Bulk Image Converter](https://remarkablemark.org/bulk-image-converter/)

## Features

- **Drag-and-drop or click to upload** multiple images at once
- **Batch conversion** to WebP, JPEG, PNG, or AVIF
- **Quality control** with a slider for lossy formats (WebP, JPEG, AVIF)
- **ZIP download** of all converted images in one click
- **Per-file status** tracking (pending, converting, done, error)

## Install

Clone the repository:

```sh
git clone https://github.com/remarkablemark/bulk-image-converter.git
cd bulk-image-converter
```

Install the dependencies:

```sh
npm install
```

## Environment Variables

Copy the environment variables:

```sh
cp .env.example .env
```

Add the **Secrets** in the repository **Settings**.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode.

Open [http://127.0.0.1:5173](http://127.0.0.1:5173) to view it in the browser.

The page will reload if you make edits.

You will also see any errors in the console.

### `npm run build`

Builds the app for production to the `dist` folder.

It correctly bundles in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

Your app is ready to be deployed!

### `npm run lint`

Checks the code quality.

### `npm run lint:tsc`

Checks for type errors.

### `npm test`

Runs the tests.

## License

[MIT](LICENSE)
