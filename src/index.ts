/**
 * File name: src/index.ts
 * Created by Visual studio code
 * User: Danh Le / danh.danh20051995@gmail.com
 * Date: 2021-03-10 17:07:50
 */
import * as path from 'path'
import * as glob from 'glob'
import * as babelJest from 'babel-jest'
import { TransformOptions } from '@babel/core'
import type { Transformer } from '@jest/transform'

const createTransformer = (options?: TransformOptions) => {
  const transformer = babelJest.createTransformer(options)

  const process = transformer.process
  transformer.process = (sourceText, sourcePath, ...args) => {
    const regexp = /^\s*import\s+(?:[^"'`{}]+\s)?(["'])(.+)\1/gm
    const patterns = []
    let match = regexp.exec(sourceText)

    while (match !== null) {
      const fileImport = match[2]
      const lineReplace = match[0]
      if (glob.hasMagic(fileImport)) {
        patterns.push({
          fileImport,
          lineReplace
        })
      }
      match = regexp.exec(sourceText)
    }

    if (patterns.length > 0) {
      const cwd = path.dirname(sourcePath)
      const importNameRegex = /import ([a-zA-Z0-9]{1,}) from /

      for (const { fileImport, lineReplace } of patterns) {
        const modNames: string[] = []
        const matchModuleName: RegExpExecArray | null = importNameRegex.exec(lineReplace)

        const files = glob
          .sync(fileImport, { cwd, dot: true })
          .map((mod, index) => {
            if (!matchModuleName) {
              return `import '${mod}'`
            }
            const moduleName = `${matchModuleName[1]}${index}`
            modNames.push(moduleName)
            return `import * as ${moduleName} from '${mod}'`
          })

        if (matchModuleName && modNames.length) {
          files.push(`const ${matchModuleName[1]} = [ ${modNames.join(', ')} ]`)
        }

        sourceText = sourceText.replace(lineReplace, files.join('\n'))
      }
    }

    return process(sourceText, sourcePath, ...args)
  }

  return transformer
}

const transformer: Transformer = {
  ...createTransformer(),
  createTransformer
}

export = transformer
