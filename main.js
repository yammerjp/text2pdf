const CHARACTOR_ENCODING = "utf8";
const LINE_WIDTH_MAX = 80;
const fs = require("fs");
const msGothicDicString = `<<
/Type /Font
/Subtype /CIDFontType2
/BaseFont /#82l#82r#83S#83V#83b#83N
/WinCharSet 128
/FontDescriptor <<
/Type /FontDescriptor
/FontName /#82l#82r#83S#83V#83b#83N
/Flags 39
/FontBBox [ -150 -147 1100 853 ]
/MissingWidth 507
/StemV 92
/StemH 92
/ItalicAngle 0
/CapHeight 853
/XHeight 597
/Ascent 853
/Descent -147
/Leading 0
/MaxWidth 1000
/AvgWidth 507
/Style << /Panose <0805020B0609000000000000> >>
>>
/CIDSystemInfo
<<
 /Registry(Adobe)
 /Ordering(Japan1)
 /Supplement 2
>>
/DW 1000
/W [
 231 389 500
 631 631 500
]
>>`;

function IsHalfWidth(chrCode) {
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

class PdfObject {
    constructor(value) {
        this.content = value;
    }
    toString() {
        return this.content;
    }
}
class BooleanPO extends PdfObject{
    constructor(value) {
        super(value);
    }

}
class NullPO extends PdfObject {
    toString() {
        return 'null';
    }
}
class NumberPO extends PdfObject {

}
class HarfWidthStringPO extends PdfObject {
    toString() {
        return `(${this.content})`;
    }
}
class StringPO extends PdfObject{
    toString() {
        let str = "<";
        for (let i = 0; i < this.content.length; i++) {
            str += ("0000"+ this.content.charCodeAt(i).toString(16)).slice(-4);
            //("0000000000" + content.length.toString(10)).slice(-10)
        }
        str += ">";
        return str;
    }
}

class NamePO extends PdfObject{
    toString() {
        return `/${this.content}`;
    }
}
class ArrayPO extends PdfObject {
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
class DictionaryPO extends PdfObject{
    constructor() {
        super();
        this.content = {};
    }
    add(key,value) {
        this.content[key.toString()] = value;
    }
    toString() {
        let str = "<<\n";
        for (let key in this.content) {
            str += `${key} ${this.content[key].toString()}\n`;
        }
        str += ">>";
        return str;
    }
}
class IndirectReference extends PdfObject{
    constructor(number) {
        super();
        this.number = number;
        this.content = new Array();
    }
    refer() {
        return `${this.number} 0 R`;
    }
    toString() {
        return this.refer();
    }
    define() {
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
class StringToString{
    constructor(text){
        this.text = text;
    }
    toString() {
        return this.text;
    }
}
class IndirectReference0 extends IndirectReference {
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
class IndirectReferences {
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
class StringStreamPO {
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
class TextStreamPO extends StringStreamPO {
    constructor() {
        //arr_string ...  string の配列
        super();
        super.add("BT");
    }
    writeLine(arr_string, arr_isHarfWidth, fontName, fontSize) {
        super.add(`${new NamePO(fontName)} ${fontSize} Tf`);
        arr_string.forEach((string, idx) => {
            super.add(`${new NumberPO(arr_isHarfWidth[idx]?-7:0)} Tc`);
            let str = `${new StringPO(string).toString()} Tj`;
            if (idx + 1 == arr_string.length)
                str += " T*";//改行記号
            super.add(str);
        });
        super.add();
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
class FontDictionaryPO extends DictionaryPO {
    constructor(fontName,baseFont,subtype,encoding,descendantFonts_arrPO) {
        super();

        const dict = new DictionaryPO();
        dict.add(new NamePO("Type"), new NamePO("Font"));
        if(fontName!=undefined) dict.add(new NamePO("Subtype"),new NamePO(subtype));
        if(baseFont!=undefined) dict.add(new NamePO("BaseFont"), new NamePO(baseFont));
        if(encoding!=undefined) dict.add(new NamePO("Encoding"),new NamePO(encoding));
        if(descendantFonts_arrPO!=undefined) dict.add(new NamePO("DescendantFonts"),descendantFonts_arrPO);
        
        const dict2 = new DictionaryPO();
        dict2.add(new NamePO(fontName),dict);
        this.add(new NamePO("Font"), dict2)

        this.fontName = fontName;
    }
}
class PageDictionaryPO extends DictionaryPO {
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
class PageTreeDictionaryPO extends DictionaryPO {
    constructor(arrPO_kids) {
        super();
        super.add(new NamePO("Kids"), arrPO_kids);
        super.add(new NamePO("Count"), new NumberPO(arrPO_kids.getLength()))
        super.add(new NamePO("Type"), new NamePO("Pages"));
    }
}
class DocumentCalalogDictionaryPO extends DictionaryPO {
    constructor(pageTreePO) {
        super();
        super.add(new NamePO("Pages"), pageTreePO);
        super.add(new NamePO("Type"), new NamePO("Catalog"));
    }
}


class PdfGenerator {
    constructor(text) {
        this.IRs = new IndirectReferences();

        this.documentCatalog = this.IRs.add();
        this.pageTree = this.IRs.add();
        this.font = this.IRs.add();
        this.fontDescriptor = this.IRs.add();
        this.fontDescriptor.add(new StringToString(msGothicDicString));
        
        this.fontName = "F0";
        this.font.add(new FontDictionaryPO(
            this.fontName,
            "#82l#82r#83S#83V#83b#83N",
            "Type0", "UniJIS-UTF16-H",
            new ArrayPO(this.fontDescriptor)
        ))
        this.pageArrPO = new ArrayPO();


        const lines = splitLines(text);
        const pages = splitPages(lines);
    
        pages.forEach((lines) => {
            const textStream = this.IRs.add();
            const page = this.IRs.add();
    
            const strm = new TextStreamPO();
            strm.add(lines,this.fontName,12,52.5,842-57,14);
            //new TextStreamPO().add(arr_line, fontName, fontSize, startX, startY, textLeading)
            textStream.add(strm);
        
    
            page.add(new PageDictionaryPO(this.pageTree, this.font, textStream));
            
            this.pageArrPO.add(page);
        });

        this.pageTree.add(new PageTreeDictionaryPO(this.pageArrPO));
        this.documentCatalog.add(new DocumentCalalogDictionaryPO(this.pageTree));

        function splitLines(text) {
            //行ごとに分割
            //各行がLINE_WIDTH_MAXを超える場合は改行して分割
            const lines = new Array();
            
            for (let i = 0, j = 0, lineWidth = 0, max = text.length; i < max; i++) {
                lineWidth += IsHalfWidth(text.charCodeAt(i)) ? 1 : 2;
                if (i == max - 1 || text[i] == "\n" || lineWidth >= LINE_WIDTH_MAX || (lineWidth == LINE_WIDTH_MAX - 1 && !(IsHalfWidth(text.charCodeAt(i + 1))))) {
                    let line = text.slice(j + 1, i + 1);
                    line = line.replace(/\r?\n/g, '');
                    lines.push(line);
                    j = i;
                    lineWidth = 0;
                }
            }
            return lines;
        }
        function splitPages(lines) {
            //ページごとにlinesを分割して配列として返却
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
    write(filename) {
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
    testWriter() {
        console.log(this.write(1));
    }
}

const pg2 = new PdfGenerator(fs.readFileSync(process.argv[2], CHARACTOR_ENCODING));
pg2.testWriter();

