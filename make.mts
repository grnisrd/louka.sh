import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'

import vm from 'vm2'
import * as ws from 'ws'
import chokidar from 'chokidar'
import servehandler from 'serve-handler'

import * as babel from '@babel/core'
import presetTypescript from '@babel/preset-typescript'
import presetReact from '@babel/preset-react'
import presetEnv from '@babel/preset-env'

import dayjs from 'dayjs'
import postcss from 'postcss'
import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import * as nanojsxRuntime from 'nano-jsx/esm/jsx-runtime'
import * as nanojsx from 'nano-jsx/esm'
import * as mdx from '@mdx-js/mdx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'

const __filename = fileURLToPath(import.meta.url)
const root = path.dirname(__filename)

interface Frontmatter {
  title: string
  description: string
  date: string
}

async function compilePage(contents: string, filename: string) {
  const babelCompile = babel.transformSync(contents, {
    filename: filename,
    presets: [
      [
        presetTypescript,
        {
          isTSX: true,
          allExtensions: true,
        },
      ],
      [
        presetReact,
        {
          runtime: 'automatic',
          importSource: 'nano-jsx/lib',
        },
      ],
      [
        presetEnv,
        {
          modules: ['cjs'],
        },
      ],
    ],
  })

  const vmContext = { exports: {} as Record<string, any> }
  const vmForFile = new vm.NodeVM({
    require: {
      external: true,
      root: path.resolve('./'),
    },

    allowAsync: true,
    sandbox: vmContext,
  })

  return vmForFile.run(babelCompile.code, filename).default
}

async function buildSite(includeLiveReload?: boolean) {
  const srcContentsDir = path.join(root, 'src')
  const srcContents = await fs.promises.readdir(srcContentsDir)
  const postContentsDir = path.join(root, 'src/posts')
  const postContents = await fs.promises.readdir(postContentsDir)
  const publicFolder = path.join(root, 'public')
  const publicFiles = await fs.promises.readdir(publicFolder)
  const outFolder = path.join(root, 'out')
  const outPosts = path.join(outFolder, 'posts')

  if (fs.existsSync(outFolder)) {
    await fs.promises.rm(outFolder, { force: true, recursive: true })
  }
  await fs.promises.mkdir(outFolder)
  await fs.promises.mkdir(outPosts)

  // Include live reload if specified.
  let postfix = ''
  if (includeLiveReload) {
    postfix = `<script>${await fs.promises.readFile('./livereload.js', 'utf-8')}</script>`
  }

  // Build +layout.tsx.
  const layoutFile = await fs.promises.readFile(path.join(srcContentsDir, '+layout.tsx'), 'utf-8')
  const componentLayout = await compilePage(layoutFile, '+layout.tsx')
  const generateLayout = (uri: string, component: any, props?: Record<any, any>) => {
    return `<!DOCTYPE html>\n${nanojsx.renderSSR(() => componentLayout({ body: component(props), uri }))}${postfix}`
  }

  // Post index for the index page.
  const postIndex = {} as Record<string, Frontmatter>

  // Build the markdown.
  for (const postFile of postContents) {
    const postName = path.parse(postFile).name
    const postPath = path.join(postContentsDir, postFile)
    const postContents = await fs.promises.readFile(postPath, 'utf-8')
    const compiledPost = await mdx.evaluate(postContents, {
      ...nanojsxRuntime,
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
      development: false,
    })
    postIndex[postName] = compiledPost.frontmatter as Frontmatter
    const renderedPost = generateLayout(postName, compiledPost.default)
    await fs.promises.writeFile(path.join(outPosts, `${postName}.html`), renderedPost, 'utf-8')
  }

  // Build the tsx pages.
  for (const pageFile of srcContents) {
    if (!pageFile.startsWith('+') && pageFile.endsWith('.tsx')) {
      const pageName = path.parse(pageFile).name
      const contentsPage = await fs.promises.readFile(path.join(srcContentsDir, pageFile), 'utf-8')
      const componentPage = await compilePage(contentsPage, pageFile)
      await fs.promises.writeFile(
        path.join(outFolder, `${pageName}.html`),
        generateLayout(pageName, componentPage, { posts: postIndex }),
        'utf-8'
      )
    }
  }

  // Build public files.
  for (const file of publicFiles) {
    const filePath = path.join(publicFolder, file)
    await fs.promises.copyFile(filePath, path.join(outFolder, file))
  }

  // Generate the tailwind CSS from the built website.
  const inputCss = await fs.promises.readFile(path.join(srcContentsDir, 'index.css'), 'utf-8')
  const css = await postcss([autoprefixer(), tailwind({ content: ['./out/**/*.html'] })]).process(inputCss, {
    from: undefined,
  })
  await fs.promises.writeFile(path.join(outFolder, 'index.css'), css.css)
}

async function main(isDev: boolean) {
  if (isDev) {
    const srv = new ws.WebSocketServer({ port: 3001 })
    const listeners = [] as ws.WebSocket[]

    srv.on('connection', (socket) => {
      listeners.push(socket)
      socket.on('close', () => listeners.splice(listeners.indexOf(socket), 1))
    })

    await buildSite(true)
    chokidar.watch('./src', { ignoreInitial: true }).on('all', async () => {
      await buildSite(true)
      listeners.forEach((l) => l.send('reload'))
    })

    http
      .createServer(async (req, res) => {
        await servehandler(req, res, {
          public: './out',
        })
      })
      .listen(3000)
  } else {
    buildSite()
  }
}

main(process.argv.includes('dev'))
