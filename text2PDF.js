const fs = require("fs");

class PdfObject {//PDFファイルの構造としてのオブジェクト
    constructor(content) {
        this.content = content;
    }
    toString() {
        return this.content;
    }
}
class BooleanPO extends PdfObject{//PDFファイルの構造としての真偽値オブジェクト
    constructor(value) {
        super(value);
    }

}
class NullPO extends PdfObject {//PDFファイルの構造としてのnullオブジェクト
    toString() {
        return 'null';
    }
}
class NumberPO extends PdfObject {//PDFファイルの構造としての数値オブジェクト 数値をthis.contentとして持ち、toString()できる。

}
class StringPO extends PdfObject{//PDFファイルの構造としての文字列オブジェクト 文字列をthis.contentとして持ち、toString()で'<>'で囲んでバイナリ形式で返す
    toString() {/*
        for (let i = 0; i < this.content.length; i++) {
            if (IsHalfWidth(this.content.charCodeAt(i)))
                continue;
            return this.toStringBinary();
        }
        return this.toStringText();
        */
        return this.toStringBinary();
    }
    toStringBinary() {
        let str = "<";
        for (let i = 0; i < this.content.length; i++) {
            str += ("0000"+ this.content.charCodeAt(i).toString(16)).slice(-4);
            //("0000000000" + content.length.toString(10)).slice(-10)
        }
        str += ">";
        return str;
    }
    toStringText() {
        return `(${this.content})`;
    }
}
class HarfWidthStringPO extends StringPO {//PDFファイルの構造としての文字列オブジェクト 文字列をthis.contentとして持ち、toString()で'()'で囲んで返す
    toString() {
        return super.toStringText();
    }
}
class NamePO extends PdfObject{//PDFファイルの構造としての名前オブジェクト 文字列をthis.contentとして持ち、toString()で'/'をつけて返す
    toString() {
        return `/${this.content}`;
    }
}
class ArrayPO extends PdfObject {//PDFファイルの構造としての配列オブジェクト PDFのオブジェクトの配列を持つ toString()で[data1 data2 ...]のように返す
    constructor(...arr) {
        super();
        if (arr instanceof Array)
            this.content = arr;
        else
            this.content = new Array();
    }
    toString() {
        let str = "[";
        this.content.forEach((val) => {
            str += `${val.toString()} `;
        });
        str = str.slice(0, str.length - 1) +"]";
        return str;
    }
    add(arg) {
        this.content.push(arg);
    }
    getLength() {
        return this.content.length;
    }
}
class DictionaryPO extends PdfObject{//PDFファイルの構造としての辞書オブジェクト 名前オブジェクトと任意オブジェクトの対を、任意の数持つ
    constructor() {
        super();
        this.content = {};
    }
    add(key,value) {
        this.content[key.toString()] = value;
    }
    toString() {//<<\n/Name1 Object1\n/Name2 Object2 /\...>> のように返す
        let str = "<<\n";
        for (let key in this.content) {
            str += `${key} ${this.content[key].toString()}\n`;
        }
        str += ">>";
        return str;
    }
}
class IndirectReference extends PdfObject{//PDFファイルの構造としての間接オブジェクト 間接オブジェクト番号と、任意の数の任意オブジェクトを持つ
    constructor(number) {
        super();
        this.number = number;
        this.content = new Array();
    }
    refer() {
        return `${this.number} 0 R`;
    }
    toString() {// ObjNum 0 R
        return this.refer();
    }
    define() { // ObjNum 0 obj\nObj1\nObj2\n ... \nendobj\n
        let str = `${this.number} 0 obj\n`;
        this.content.forEach((cont) => {
            str +=`${cont.toString()}\n`;
        });
        str += `endobj\n`;
        return str;
    }
    add(arg) {
        this.content.push(arg);
    }
}
class StringToString{////PDFファイルの構造としての任意のオブジェクト ファイルに表記されているまま定義することができる。
    constructor(text){
        this.text = text;
    }
    toString() {
        return this.text;
    }
}
class IndirectReference0 extends IndirectReference {//PDFファイルの構造としての0番目のオブジェクト 特別な存在
    constructor() {
        super();
        this.number = 0;
        this.content = new Array();
    }
    refer() {
        return `${this.number} 0 R`;
    }
    toString() {
        return this.refer();
    }
    define() {
        return "";
    }
    add(arg) {
    }
}
class IndirectReferences { //出力PDFのすべての間接オブジェクトを配列としてもつ
    constructor() {
        this.arr = new Array();
        this.arr.push(new IndirectReference0());
    }
    add(newIR = new IndirectReference(this.arr.length)) {
        this.arr.push(newIR);
        return newIR;
    }
    call(num) {
        if (num <= this.arr.length)
            return this.arr[num];
        else
            return undefined;
    }
}
class StringStreamPO { //PDFファイルの構造としてのストリームオブジェクト
    constructor() {
        this.content = "";
        this.lenDic = new DictionaryPO();
        this.lenDic.add(new NamePO("Length"),new NumberPO(0));
    }
    add(line) {
        this.content += `${line}\n`;
        this.lenDic.add(new NamePO("Length"), new NumberPO(this.content.length));
    }
    toString() {
        return `${this.lenDic.toString()}stream\n${this.content}\nendstream\n`;
    }
}
class TextStreamPO extends StringStreamPO { //文字列描画のみが可能なストリームオブジェクト
    constructor() {
        //arr_string ...  string の配列
        super();
        super.add("BT");
    }
    writeLine(arr_string, arr_isHarfWidth, fontName, fontSize) {//文字列一行分の 描画命令を ストリームオブジェクトに記述
        //第1,2引数はDevideHarfOrFullWidthStringの戻り値
        super.add(`${new NamePO(fontName)} ${fontSize} Tf`);
        arr_string.forEach((string, idx) => {
            super.add(`${new NumberPO(arr_isHarfWidth[idx]?(-fontSize/2):0)} Tc`);
            let str = `${new StringPO(string).toString()} Tj`;
            if (idx + 1 == arr_string.length)
                str += " T*";//改行記号
            super.add(str);
        });
    }
    add(arr_line, fontName, fontSize, startX, startY, textLeading) {//入力を各行ごとに、this.writeLine()に渡す
        //arr_line... 複数行からなる文字列
        //半角文字は、文字幅を半分に(正確には文字間隔を-0.5文字に指定)しないと横に伸びてしまうので
        //半角全角交じり文字列を半角のみ、全角のみに分割して、文字列の配列として並べてwriteLineに渡している
        
        if (startX != undefined && startY != undefined)
            super.add(`${startX} ${startY} Td`);
        if (textLeading != undefined)
            super.add(`${textLeading} TL`);
        
        arr_line.forEach((line) => {
            const [arr_string, arr_isHarfWidth] = DevideHarfOrFullWidthString(line);
            this.writeLine(arr_string, arr_isHarfWidth,fontName,fontSize);
        });

        function DevideHarfOrFullWidthString(line) { //半角全角混合の文字列を渡すと、半全の変化ごとに切り分けて配列にする
            //戻り値は、分割した配列と、同順で半角ならtrueの配列
            const str_arr = new Array();
            const font_arr = new Array();
            let str = "";
            let wasHarfWidth = IsHalfWidth(line.charCodeAt(0));
            for (let i = 0; i < line.length; i++){
                const isHalfWidth = IsHalfWidth(line.charCodeAt(i));
                if (isHalfWidth != wasHarfWidth) {
                    str_arr.push(str);
                    str = "";
                    font_arr.push(wasHarfWidth);
                    wasHarfWidth = isHalfWidth;
                }
                str += line[i];
            }
            str_arr.push(str);
            font_arr.push(wasHarfWidth);
            return [str_arr,font_arr];
        }
    }
    toString() {
        super.add("ET");
        return super.toString();
    }
}
class FontDictionaryPO extends DictionaryPO { //フォント定義に用いる辞書オブジェクト
    constructor(fontName,baseFont,subtype,encoding,descendantFonts_arrPO) {
        super();

        const dict = new DictionaryPO();
        dict.add(new NamePO("Type"), new NamePO("Font"));
        if(subtype!=undefined) dict.add(new NamePO("Subtype"),new NamePO(subtype));
        if(baseFont!=undefined) dict.add(new NamePO("BaseFont"), new NamePO(baseFont));
        if(encoding!=undefined) dict.add(new NamePO("Encoding"),new NamePO(encoding));
        if(descendantFonts_arrPO!=undefined) dict.add(new NamePO("DescendantFonts"),descendantFonts_arrPO);
        
        const dict2 = new DictionaryPO();
        dict2.add(new NamePO(fontName),dict);
        this.add(new NamePO("Font"), dict2)

        this.fontName = fontName;
    }
}
class PageDictionaryPO extends DictionaryPO { //ページ定義に用いる辞書オブジェクト
    constructor(parentPO,resourcesPO,contensPO) {
        super();
        const a4 = new ArrayPO(new NumberPO(0), new NumberPO(0), new NumberPO(595), new NumberPO(842));
        super.add(new NamePO("Parent"),parentPO);
        super.add(new NamePO("MediaBox"),a4);
        super.add(new NamePO("Resources"),resourcesPO);
        super.add(new NamePO("Contents"), contensPO);
        super.add(new NamePO("Type"), new NamePO("Page"));
    }
}
class PageTreeDictionaryPO extends DictionaryPO { //ページツリー定義に用いる辞書オブジェクト
    constructor(arrPO_kids) {
        super();
        super.add(new NamePO("Kids"), arrPO_kids);
        super.add(new NamePO("Count"), new NumberPO(arrPO_kids.getLength()))
        super.add(new NamePO("Type"), new NamePO("Pages"));
    }
}
class DocumentCalalogDictionaryPO extends DictionaryPO { //ドキュメントカタログ定義に用いる辞書オブジェクト
    constructor(pageTreePO) {
        super();
        super.add(new NamePO("Pages"), pageTreePO);
        super.add(new NamePO("Type"), new NamePO("Catalog"));
    }
}

class PdfGenerator { //textを入力としてPDFを出力する
    constructor(text, tags = undefined) {//tagsはMarkDownTag型のインスタンスを集めた配列 tagsが未指定の場合はテキストモード.textを純粋にPDFとして出力
        this.tags = tags;

        this.IRs = new IndirectReferences();
        this.documentCatalog = this.IRs.add();
        this.pageTree = this.IRs.add();

        this.pageArrPO = new ArrayPO();

        this.defineFont();
        this.makePages(text);
    }
    defineFont() {//フォント定義をまとめた間接オブジェクトsを生成
        this.font = this.IRs.add();
        this.fontDescriptor = this.IRs.add();
        this.fontDescriptor.add(MsGothicDictionary());
        
        this.fontName = "F0";
        this.fontSize = 12;
        this.font.add(new FontDictionaryPO(
            this.fontName,
            "#82l#82r#83S#83V#83b#83N",
            "Type0", "UniJIS-UTF16-H",
            new ArrayPO(this.fontDescriptor)
        ));

        function MsGothicDictionary() {
            //MSゴシックのフォント定義となるPDFの辞書オブジェクトが戻り値
                const dic = new DictionaryPO();
                const dic2 = new DictionaryPO();
                const dic3 = new DictionaryPO();
                const dic2_2 = new DictionaryPO();
                
                dic.add(new NamePO("Type"), new NamePO("Font"));
                dic.add(new NamePO("Subtype"), new NamePO("CIDFontType2"));
                dic.add(new NamePO("BaseFont"), new NamePO("#82l#82r#83S#83V#83b#83N"));
                dic.add(new NamePO("WinCharSet"), new NumberPO(128));
                dic.add(new NamePO("FontDescriptor"), dic2);
                dic.add(new NamePO("CIDSystemInfo"), dic3);
                dic.add(new NamePO("DW"), new NumberPO(1000));
                dic.add(new NamePO("W"), new ArrayPO(new NumberPO(231), new NumberPO(389), new NumberPO(500), new NumberPO(631), new NumberPO(631), new NumberPO(500)));
                
                dic2.add(new NamePO("Type"), new NamePO("FontDescriptor"));
                dic2.add(new NamePO("FontName"), new NamePO("#82l#82r#83S#83V#83b#83N"));
                dic2.add(new NamePO("Flags"), new NumberPO(39));
                dic2.add(new NamePO("FontBBox"), new ArrayPO(new NumberPO(-150), new NumberPO(-147), new NumberPO(1100), new NumberPO(853)));
                dic2.add(new NamePO("MissingWidth"), new NumberPO(507));
                dic2.add(new NamePO("StemV"), new NumberPO(92));
                dic2.add(new NamePO("StemH"), new NumberPO(92));
                dic2.add(new NamePO("ItalicAngle"), new NumberPO(0));
                dic2.add(new NamePO("CapHeight"), new NumberPO(853));
                dic2.add(new NamePO("XHeight"), new NumberPO(597));
                dic2.add(new NamePO("Ascent"), new NumberPO(853));
                dic2.add(new NamePO("Descent"), new NumberPO(-147));
                dic2.add(new NamePO("Leading"), new NumberPO(0));
                dic2.add(new NamePO("MaxWidth"), new NumberPO(1000));
                dic2.add(new NamePO("AvgWidth"), new NumberPO(507));
                dic2.add(new NamePO("Style"), dic2_2);
            
                dic2_2.add(new NamePO("Panose"), new StringToString("<0805020B0609000000000000>"));
            
                dic3.add(new NamePO("Registry"), new HarfWidthStringPO("Adobe"));
                dic3.add(new NamePO("Ordering"), new HarfWidthStringPO("Japan1"));
                dic3.add(new NamePO("Supplement"), new NumberPO(2));
            
                return dic;
            }
    }
    makePages(text) {//textを入力として必要なだけthis.definePage()
        const maxNumCharDefaultSize = 40*2;//ページに表示する文字数*2
        const maxNumLinesDefaultSize = 52;//ページに表示する行数
        const tagContentsSets = structMarkDown(text, maxNumCharDefaultSize,this.tags);//タグと一行文字列の配列、の配列

        const pages = splitPages(tagContentsSets,maxNumLinesDefaultSize);
    
        pages.forEach((page) => {
            this.definePage(page);
        });

        this.structPageTree();

        function splitLines(text) {//元文章を改行で分割 戻り値は各行の配列
            text = text.replace(/\r/g, '');
            const lines = text.split("\n");
            return lines;
        }
        function splitLongLine(lineIn,maxNumCharDefaultSize) {//入力行がlineWidthを超える場合は分割 戻り値は入力行を分割した配列
            const lines = new Array();
            let line = "";
            for (let i = 0, lineWidth = 0, max = lineIn.length; i < max; i++) {
                lineWidth += IsHalfWidth(lineIn.charCodeAt(i)) ? 1 : 2;
                line +=lineIn[i];
                if (lineWidth == maxNumCharDefaultSize ||
                    (lineWidth == maxNumCharDefaultSize - 1 && !(IsHalfWidth(lineIn.charCodeAt(i + 1))))) {
                    lines.push(line);
                    line = "";
                    lineWidth=0;
                }
    
            }
            lines.push(line);
            return lines;
        }
        function splitPages(tagContentsSets, maxNumLinesDefaultSize) {//page(tabContentsSetsの配列)の配列を返却
            //第二引数の長さ以下で、(場合によっては区切り目のtagContentsSetsを分割して)page(tabContentsSetsの配列)をつくる。
            //長さが長いときは、新しいpageをつくる。
            //全てのpageの配列がpages

            const pages = new Array();
            let page = new Array();
            let height = 0;
            tagContentsSets.forEach((tagContentSet) => {
                const lineHeight = tagContentSet.tag.fontExpansionRate;
                const tagOffset = tagContentSet.tag.startOffSet;
                height += tagOffset[1];
                while (height + lineHeight * tagContentSet.contents.length > maxNumLinesDefaultSize) {//このページにcontents全てが表示できない
                    if (height + lineHeight <= maxNumLinesDefaultSize) {//少なくとも1行はまだ同じページに表示できる
                        const harfContentsLen = Math.floor((maxNumLinesDefaultSize - height) / lineHeight);
                       
                        const harfContents = tagContentSet.contents.slice(0,harfContentsLen);
                        const tagContentSetHarf = { tag: tagContentSet.tag, contents:  harfContents };//Object.assign({}, tagContentSet);

                        page.push(tagContentSetHarf);
                        height += lineHeight * harfContentsLen;
                        tagContentSet.contents.splice(0,harfContentsLen);
                    }

                    pages.push(page);
                    page = [];
                    height = 0;
                }
                page.push(tagContentSet);
                height += lineHeight * tagContentSet.contents.length;
            });
            pages.push(page);
            return pages;
        }
        function structMarkDown(text, maxNumCharDefaultSize, tags = new Array()) {
            let markDownMode=true;
            if (tags.length == 0) {
                //テキストモード   元文章の全ての行をそれぞれnoNameというタグのコンテンツとする。タグごとの間隔(offSet)は0
                markDownMode = false;
                tags.push(new MarkDownTag("noName"));
            }

            const linesLong = splitLines(text);
            const tagContentsSets = new Array();
            let wasBlankLine = false;
            let tagContentSetBefore=undefined;
            linesLong.forEach((lineLong) => {
                if (markDownMode&& lineLong == "") {//空行は省略
                    wasBlankLine = true;
                    return;
                }
                const findedTag = tags.find((tag) => tag.regExp.test(lineLong));//tagsのtagの正規表現から、入力行が該当するものをみつける
                if (markDownMode&&findedTag.name == "p" && tagContentSetBefore!=undefined && tagContentSetBefore.tag.name == "p" && !wasBlankLine)
                    tagContentSetBefore.contents += ` ${findedTag.takeOutContent(lineLong)}`;//pタグ内では改行を無視
                else if (findedTag != undefined) {
                    tagContentsSets.push({ tag: findedTag, contents: findedTag.takeOutContent(lineLong) });//タグと入力行の対でtagContentsSetを作る。これの配列がtagContentsSets
                }
                tagContentSetBefore = tagContentsSets[tagContentsSets.length - 1];
                wasBlankLine = false;
            });

            tagContentsSets.forEach((tagContentSet) => {//タグ内の内容が長すぎる場合は、表示時に改行されるように分割
                const width = Math.floor(maxNumCharDefaultSize / tagContentSet.tag.fontExpansionRate);
                tagContentSet.contents = splitLongLine(tagContentSet.contents, width);
            });
            return tagContentsSets;
        }
    }
    definePage(tagContentsSets) { //ページとなる間接オブジェクトとそのページの表示内容であるストリームオブジェクトの間接オブジェクトを生成
        const textStream = this.IRs.add();
        const page = this.IRs.add();

        const strm = new TextStreamPO();
        let offSet = { x: 52.5, y: 842 - 57 };//A4用紙の描画初期位置
        tagContentsSets.forEach((tagContentSet) => {
            const expandedFontSize = this.fontSize * tagContentSet.tag.fontExpansionRate;//描画フォントサイズ
            offSet.x += this.fontSize * tagContentSet.tag.startOffSet[0];//タグの表示オフセットを反映
            offSet.y -= this.fontSize * tagContentSet.tag.startOffSet[1];//同上
            strm.add(tagContentSet.contents, this.fontName, expandedFontSize, offSet.x, offSet.y, expandedFontSize * 1.2);
            //ストリームに描画(元文章の一行、出力側は複数行かも)
            offSet = { x: -this.fontSize * tagContentSet.tag.startOffSet[0],y:0};//横方向のオフセットをもとに戻す
        });
//        strm.add(lines,this.fontName,12,52.5,842-57,14);
//        strm.add(lines,this.fontName,12,0,0,14);
        //new TextStreamPO().add(arr_line, fontName, fontSize, startX, startY, textLeading)
        textStream.add(strm);
    
        page.add(new PageDictionaryPO(this.pageTree, this.font, textStream));
        
        this.pageArrPO.add(page);
    }
    structPageTree() {//constructorで既につくられたページツリーである関節オブジェクトに全ページの情報を記述
        this.pageTree.add(new PageTreeDictionaryPO(this.pageArrPO));
        this.documentCatalog.add(new DocumentCalalogDictionaryPO(this.pageTree));
    }
    generate() {//定義された間接オブジェクトsからPDFファイルを生成 データを戻り値として持つ。
        let content = `%PDF-1.7\n%????\n`;
        let crossReferenceTable = `xref\n0 ${this.IRs.arr.length}\n`;
        this.IRs.arr.forEach((ir, idx) => {
            if (idx == 0) {
                crossReferenceTable += `0000000000 65535 f \n`; 
            }
            else {
                const byteOffset = ("0000000000" + content.length.toString(10)).slice(-10);
                crossReferenceTable += `${byteOffset} 00000 n \n`;    
                content += ir.define();
            }
        });

        const dict = new DictionaryPO();
        dict.add(new NamePO("Root"), this.IRs.call(1));
        dict.add(new NamePO("Size"),new NumberPO(this.IRs.arr.length));
        const trailer = `trailer\n\n${dict.toString()}startxref\n${content.length}\n%%EOF`;
        
        return content+crossReferenceTable+trailer;
    }
}

class MarkDownTag {
    constructor(name, regExp = /.*/, fontExpansionRate = 1.0, outSide = [0, 0], startOffSet = [0, 0]) {
        //( タグ名(文字列) , タグに一致する正規表現 , 文字の拡大率 , 
        //  タグを表している前後の記号の数 ex "# h1"..[2, 0] "**strong**"...[2, 2] , 表示位置をずらす場合の[x,y]差分(標準フォントサイズに対する値) )
        this.name = name;
        this.regExp=regExp;
        this.fontExpansionRate = fontExpansionRate;
        this.outSide = outSide;
        this.startOffSet=startOffSet;
    }
    takeOutContent(text) {
        return text.slice(this.outSide[0],text.length-this.outSide[1]);
    }
}

function main(commandLineArg) {
    let inputFileName;
    let outputFileName = nameOutputFile();
    let markDownMode;

    const hyphenH = commandLineArg.findIndex((arg) => {//ヘルプ参照
        return arg == '-h' || arg == '-H' || arg == '--Help' || arg == '--help';
    });
    if (hyphenH != -1) {
        console.log("text2PDF is convert from text file to PDF file.");
        console.log("ex) $./text2PDF.exe input.hoge -o output.PDF");
        console.log("first argument : inputFileName");
        console.log(" (if it is *.md, run simple markdown mode.)");
        console.log("option:\n -o outputFileName ... define output file name,");
        console.log(" -t ... run text mode forcibily,");
        console.log(" -m ... run simple markdown mode forcibily");
        console.log(" -h ... print help");
        return;
    }

    const hyphenM = commandLineArg.findIndex((arg) => {//強制マークダウンモード
        return arg == '-m' || arg == '-M' || arg == '--Markdown' || arg == '--markdown' || arg == '--MarkDown'; 
    });
    if (hyphenM != -1) {
        markDownMode = true;
        commandLineArg.splice(hyphenM, 1);
    }

    const hyphenT = commandLineArg.findIndex((arg) => {//強制テキストモード
        return arg == '-t' || arg == '-T' || arg == '--text' || arg == '--Text';
    });
    if (hyphenT != -1) {
        markDownMode = false;
        commandLineArg.splice(hyphenT, 1);
    }

    const hyphenO = commandLineArg.findIndex((arg) => {
        return arg == '-o' || arg == '-O' || arg == '--Output' || arg == '-output';
    });//出力先指定
    if (hyphenO < commandLineArg.length - 1) {
        outputFileName = commandLineArg[hyphenO + 1];
        commandLineArg.splice(hyphenO, 2);
    }

    if (commandLineArg.length == 0) { //入力ファイルが指定されていないとき
        console.log("Error,input file is not defined.\n");
        return;
    }
    inputFileName = commandLineArg[0];
    if (!IsExistFile(inputFileName)) {
        console.log("Error,input file is not exist.\n");
        return;
    }

    if (markDownMode == undefined) //オプション指定されていないとき
        markDownMode = /\.md$/.test(inputFileName);//拡張子が.mdならマークダウンモード

    const CHARACTOR_ENCODING = "utf8";
    const textRead = fs.readFileSync(inputFileName, CHARACTOR_ENCODING);
    const tags = defineTags();
    const pdfGenerator = new PdfGenerator(textRead, (markDownMode ? tags : undefined));
    const writer = fs.createWriteStream(outputFileName);
    writer.write(pdfGenerator.generate());
}
function defineTags() {//MarkDownTagのインスタンスの集合を返す
    const h1 = new MarkDownTag("h1", /^# /, 2.0, [2, 0], [0, 1.5]);
    const h2 = new MarkDownTag("h2", /^## /, 1.5, [3, 0], [0, 1.5]);
    const h3 = new MarkDownTag("h3", /^### /, 1.125, [4, 0], [0, 1]);
    const h4 = new MarkDownTag("h4", /^#### /, 1.0, [5, 0], [0, 1]);
    const h5 = new MarkDownTag("h5", /^##### /, 0.75, [6, 0], [0, 1]);
    const h6 = new MarkDownTag("h6", /^###### /, 0.625, [7, 0], [0, 1]);
    const li = new MarkDownTag("li", /^- /, 1.0, [0, 0], [1, 1]);
    const pre = new MarkDownTag("pre", /^    /, 1.0, [4, 0], [4, 1]);
    const p = new MarkDownTag("p", undefined, 1.0, undefined, [0, 1]);

    return new Array(h1, h2, h3, h4, h5, h6, li,pre, p);
}
function IsHalfWidth(chrCode) {//文字コードを引数に、半角文字であればtrueを返す
    if ((chrCode >= 0x00 && chrCode < 0x81) ||
        (chrCode === 0xf8f0) ||
        (chrCode >= 0xff61 && chrCode < 0xffa0) ||
        (chrCode >= 0xf8f1 && chrCode < 0xf8f4)) {
        //半角文字
        return true;
    } else {
        //それ以外
        return false;
    }
};
function IsExistFile(file) {
    try {
        fs.statSync(file);
        return true;
    } catch (err) {
        if (err.code === 'ENOENT') return false;
    }
}
function nameOutputFile() {//出力先未指定時のファイル名
    for (let i = 0; ; i++) {
        const fileName = `text2pdf_output${i}.pdf`;
        if (!IsExistFile(fileName)) {
            return fileName;
        }
    }
}

main(process.argv.slice(2));
