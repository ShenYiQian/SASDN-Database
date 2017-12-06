import * as LibFs from 'mz/fs';
import * as LibPath from 'path';
import * as LibUtil from 'util';

export namespace ToolUtils {
  export function snakeCase(str: string): string {
    return str.replace(/(?:^|\.?)([A-Z])/g, (x, y) => '_' + y.toLowerCase()).replace(/^_/, '');
  }

  export function regExec(str: string, regExp: RegExp): Promise<string> {
    const matchResult = regExp.exec(str);
    if (matchResult) {
      return Promise.resolve(matchResult[0]);
    }
    throw new Error('There is no match text in this RegExp');
  }

  export function deleteAll(path: string): void {
    let files: string[] = [];
    if (LibFs.existsSync(path)) {
      files = LibFs.readdirSync(path);
      for (const file of files) {
        const curPath: string = path + "/" + file;
        if (LibFs.statSync(curPath).isDirectory()) { // recurse  
          deleteAll(curPath);
        } else { // delete file  
          LibFs.unlinkSync(curPath);
        }
      }
      LibFs.rmdirSync(path);
    }
  }

  export async function getClassName(content: string): Promise<string> {
    const classNameMatch = await ToolUtils.regExec(content, /class\s\b[A-Za-z0-9]+\b/);
    const className = classNameMatch.replace('class ', '');
    return className;
  }

  export async function getShardCount(content: string): Promise<number> {
    const matchText = await ToolUtils.regExec(content, /\.shardTable\([0-9]+\)/);
    const numberMatch = await ToolUtils.regExec(matchText, /[0-9]+/);
    const shardCount: number = parseInt(numberMatch, 10);
    return shardCount;
  }

  export async function isCopyFile(filePath: string): Promise<boolean> {
    const copyExp = /[a-zA-Z0-9]+_[0-9]+.js/;
    const copyMatch = copyExp.exec(filePath);
    if (copyMatch) {
      try {
        const stat = await LibFs.stat(filePath);
        if (stat.isFile()) {
          await LibFs.unlink(filePath);
        }
      } catch (error) {
        console.log('caught error by unlink copy file = ', error);
      }
      return true;
    }
    return false;
  }

  export function fsCopy(src: LibFs.PathLike, dest: LibFs.PathLike): Promise<any> {
    return new Promise((resolve, reject) => {
      LibFs.copyFile(src, dest, (err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  export async function copyNewFile(fileName: string, filePath: string,
    rootPath: string, index: number): Promise<{ [key: string]: string }> {
    const newFileName = `${fileName}_${index}`;
    const newFilePath = LibPath.join(rootPath, `${newFileName}.js`);
    await ToolUtils.fsCopy(filePath, newFilePath);
    return { newFileName, newFilePath };
  }

  export async function rewriteFile(className: string, content: string,
    newFilePath: string, index: number): Promise<string> {
    const newClassName = `${className}_${index}`;
    const snakeCaseTableName = ToolUtils.snakeCase(newClassName);
    const tableNameExp: RegExp = new RegExp(/\.Entity\(\'\S+\'\)/);
    let newContent = content.replace(new RegExp(className, 'gm'), newClassName);
    newContent = newContent.replace(tableNameExp, `.Entity('${snakeCaseTableName}')`);
    await LibFs.writeFile(newFilePath, newContent);
    return newClassName;
  }
}