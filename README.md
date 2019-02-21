# text2PDF
This application convert from text file to PDF file.
## Demo
$ ./text2PDF.exe hoge.txt -o hoge.PDF
$ node text2PDF hoge.txt -o hoge.PDF
## Requirements
node v11.2.0
text2PDF need a input file of UTF-8 and  only Japanese or English.
## Setup
### for windows users
please download text2PDF.exe
next ..
### for all users
## Usage

it have simple markdown mode.

$ node text2PDF input.hoge -o output.PDF -m
$ node text2PDF input.md -o output.PDF 
$ text2PDF.exe input.hoge -o output.PDF -m
$ text2PDF.exe input.md -o output.PDF 


these is same meaning. text2PDF run in markdown mode.

if input file is "*.md", text2PDF run in markdown mode.
if input file isn't "*.md", text2PDF run in text mode.

if you add "-m" option, text2PDF run in markdown mode forcibily.
if you add "-t" option, text2PDF run in text mode forcibily.

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