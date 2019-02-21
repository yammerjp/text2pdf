const CHARACTOR_ENCODING = "utf8";
const LINE_WIDTH_MAX = 80;
const fs = require("fs");

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

class PdfObject {//PDFファイルの構造としてのオブジェクト
    constructor(value) {
        this.content = value;
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
class HarfWidthStringPO extends PdfObject {//PDFファイルの構造としての文字列オブジェクト 文字列をthis.contentとして持ち、toString()で'()'で囲んで返す
    toString() {
        return `(${this.content})`;
    }
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
    writeLine(arr_string, arr_isHarfWidth, fontName, fontSize) {
        super.add(`${new NamePO(fontName)} ${fontSize} Tf`);
        arr_string.forEach((string, idx) => {
            super.add(`${new NumberPO(arr_isHarfWidth[idx]?(-fontSize/2):0)} Tc`);
            let str = `${new StringPO(string).toString()} Tj`;
            if (idx + 1 == arr_string.length)
                str += " T*";//改行記号
            super.add(str);
        });
    }
    add(arr_line, fontName, fontSize, startX, startY, textLeading) {
        
        if (startX != undefined && startY != undefined)
            super.add(`${startX} ${startY} Td`);
        if (textLeading != undefined)
            super.add(`${textLeading} TL`);
        
        arr_line.forEach((line) => {
            const [arr_string, arr_isHarfWidth] = DevideHarfOrFullWidthString(line);
            this.writeLine(arr_string, arr_isHarfWidth,fontName,fontSize);
        });

        function DevideHarfOrFullWidthString(line) {
            //半角全角混合の文字列を渡すと、半全の変化ごとに切り分けて配列にする
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
    constructor(text) {
        this.IRs = new IndirectReferences();
        this.documentCatalog = this.IRs.add();
        this.pageTree = this.IRs.add();

        this.pageArrPO = new ArrayPO();

        this.defineFont();
        this.makePages(text);
    }
    defineFont() {
        this.font = this.IRs.add();
        this.fontDescriptor = this.IRs.add();
        this.fontDescriptor.add(MsGothicDictionary());
        
        this.fontName = "F0";
        this.font.add(new FontDictionaryPO(
            this.fontName,
            "#82l#82r#83S#83V#83b#83N",
            "Type0", "UniJIS-UTF16-H",
            new ArrayPO(this.fontDescriptor)
        ));
    }
    makePages(text){
        const linesLong = splitLines(text);
        const lines = new Array();
        linesLong.forEach((lineLong) => {
            lines.push(...(splitLongLine(lineLong, LINE_WIDTH_MAX)));
        });
        const pages = splitPages(lines);
    
        pages.forEach((lines) => {
            this.definePage(lines);
        });

        this.structPageTree();

        function splitLines(text) {//行ごとに分割
            text = text.replace(/\r/g, '');
            const lines = text.split("\n");
            return lines; 
        }
        function splitLongLine(lineIn,lineWidthMax) {//入力行がlineWidthを超える場合は分割
            const lines = new Array();
            let line = "";
            for (let i = 0, lineWidth = 0, max = lineIn.length; i < max; i++) {
                lineWidth += IsHalfWidth(lineIn.charCodeAt(i)) ? 1 : 2;
                line +=lineIn[i];
                if (lineWidth == lineWidthMax ||
                    (lineWidth == lineWidthMax - 1 && !(IsHalfWidth(lineIn.charCodeAt(i + 1))))) {
                    lines.push(line);
                    line = "";
                    lineWidth=0;
                }

            }
            lines.push(line);
            return lines;
        }
        
        function splitPages(lines) { //ページごとにlinesを分割して配列として返却
            const pages = new Array();
            let page = new Array();
            const LINE_HEIGHT_MAX = 52;
            lines.forEach((line, idx) => {
                if (idx != 0 && idx % LINE_HEIGHT_MAX == 0) {
                    pages.push(page);
                    page = new Array;
                }
                page.push(line);
            });
            pages.push(page);
            
            return pages;
        }
    }
    definePage(lines) {
        const textStream = this.IRs.add();
        const page = this.IRs.add();

        const strm = new TextStreamPO();
        strm.add(lines,this.fontName,12,52.5,842-57,14);
        //new TextStreamPO().add(arr_line, fontName, fontSize, startX, startY, textLeading)
        textStream.add(strm);
    
        page.add(new PageDictionaryPO(this.pageTree, this.font, textStream));
        
        this.pageArrPO.add(page);
    }
    structPageTree() {
        this.pageTree.add(new PageTreeDictionaryPO(this.pageArrPO));
        this.documentCatalog.add(new DocumentCalalogDictionaryPO(this.pageTree));
    }
    generate() {
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

const pdfGenerator = new PdfGenerator(fs.readFileSync(process.argv[2], CHARACTOR_ENCODING));
const writer = fs.createWriteStream(process.argv[3]);
writer.write(pdfGenerator.generate());


