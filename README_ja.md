# text2PDF
text2PDFは、テキストファイルからPDFファイルを生成するソフトウェアです。
node.js(v11.2.0)によって作られ、nexeを用いて各種.exe実行ファイルを作成しました。
## Demo
    $ ./text2PDF_linux.exe README_ja.md -o README_ja.pdf
## Requirements
入力ファイルの文字コードはUTF-8を想定しています。
出力ファイルでは、日本語以外の言語は想定していません。MSゴシックに無いフォントでは文字化けの可能性があります。
## Setup
各OSに対応したexeファイルをダウンロードしてください。

## Usage
コンソール画面で、第一引数に生成元のテキストファイルを、-oオプションに生成先PDFファイルを指定してください。
    $ ./text2PDF.exe hoge.txt -o hoge.PDF
(以下、コンソールの例は適宜読み替えてください。Windows環境では./ではなく.\としてください。またtext2PDF.exeはtext2PDF_win.exe , text2PDF_linux.exe , text2PDF_mac.exeとしてください。)
テキストファイルのほかに、簡易的なマークダウン形式もサポートしています。

入力に*.mdファイルを与えるか、-mオプションを指定すると、簡易マークダウンモードで実行します。
    $ ./text2PDF.exe hoge.md -o hoge.PDF
    $ ./text2PDF.exe hoge.txt -m -o hoge.PDF
-tオプションで強制的にテキストモードで実行します。*.mdファイルをテキストモードで実行したいときに使用してください。
    $ ./text2PDF.exe hoge.md -t -0 hoge.PDF

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