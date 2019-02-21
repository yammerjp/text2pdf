# text2PDF
text2PDFは、テキストファイルからPDFファイルを生成するソフトウェアです。
node.js(v11.2.0)によって書かれています
## Demo
    $ node ./text2PDF.js README_ja.md -o README_ja.pdf
## Requirements
入力ファイルの文字コードはUTF-8を想定しています。
出力ファイルでは、日本語以外の言語は想定していません。MSゴシックに無いフォントでは文字化けの可能性があります。
## Setup
Node.jsが必要です。インストールしてください。
標準モジュール以外に必要なモジュールはありません。
text2PDF.jsをダウンロードし同ディレクトリ上で Usage を参考に引数にテキストファイルを与えるとPDFファイルを生成します。

## Usage
コンソール画面で、第一引数に生成元のテキストファイルを、-oオプションに生成先PDFファイルを指定してください。
    $ node ./text2PDF.js hoge.txt -o hoge.PDF
(Windows環境では./ではなく.\としてください。以下、コンソールの例は適宜読み替えてください。)
テキストファイルのほかに、簡易的なマークダウン形式もサポートしています。

入力に*.mdファイルを与えるか、-mオプションを指定すると、簡易マークダウンモードで実行します。
    $ node ./text2PDF.js hoge.md -o hoge.PDF
    $ node ./text2PDF.js hoge.txt -m -o hoge.PDF
-tオプションで強制的にテキストモードで実行します。*.mdファイルをテキストモードで実行したいときに使用してください。
    $ node ./text2PDF.js hoge.md -t -o hoge.PDF

## Authors

basd4g

( mail: baskk4.dt@gmail.com )

( url: https://github.com/basd4g )

## References

詳細PDF入門 ー 実装して学ぼう！PDFファイルの構造とその書き方読み方
( URL: https://itchyny.hatenablog.com/entry/2015/09/16/100000 )

手書きPDF入門
( URL: http://www.kobu.com/docs/pdf/pdfxhand.htm#a_fonts )

トラスト・ソフトウェア・システム PDF 構文 テキスト
( URL: http://www.pdf-tools.trustss.co.jp/Syntax/text.html#text_Tc )