//console.log(process.argv[2]);//コマンドライン第一引数
//console.log(process.argv[3]);//コマンドライン第二引数

const CHARACTOR_ENCODING = "utf8";

/*
const readline = require("readline");
const stream = fs.createReadStream(process.argv[2], "utf8");

const render = readline.createInterface({ input: stream });
const writer = fs.createWriteStream(process.argv[3]);

let lns = "";
render.on("line", (data) => {
    const ln = splitLine(data, 84) + "\n";
    writer.write(ln);
    lns += ln;
});
*/
const LINE_WIDTH_MAX = 36;
const fs = require("fs");

function splitLines() {
    const text = fs.readFileSync(process.argv[2], CHARACTOR_ENCODING);
    const lines = new Array();
    
    for (let i = 0, j = 0, lineWidth = 0, max = text.length; i < max; i++) {
        lineWidth += 1;
        if (i == max - 1|| text[i] == "\n" || lineWidth >= LINE_WIDTH_MAX  || (lineWidth==LINE_WIDTH_MAX-1&&!(isHalfWidth(text.charCodeAt(i+1))))) {
            let line = text.slice(j+1, i+1);
            line = line.replace(/\r?\n/g, '');
            lines.push(line);
            j = i;
            lineWidth = 0;
        }
    }
    return lines;
//    console.log(lines.join("\n"));
//    console.log(lines.length);
//    console.log(lines);

    
}
//splitPage();
/*
function splitLine(str, num) {//第二引数の文字数(全角は2文字分)で、strを行分割
    let ret = "";
    let result = 0;
    for(let i=0;i<str.length;i++){
        const chr = str.charCodeAt(i);
        if(isHalfWidth(chr)){
            result += 1;
        }else{
            result += 2;
        }
        ret += str[i];
        if (result == num) {
            ret += "\n";
            result -= num;
        } else if (result == num - 1
         && !(isHalfWidth(str.charCodeAt(i + 1)))) {
            ret += "\n";
            result -= num-1;
        }
    }
    return ret;
}
*/
function isHalfWidth(chrCode) {
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
/*
function writePDF(lines) {
    let data;
    let head =
`%PDF-1.7
%????`;
    let obj = [
`1 0 obj 
<<
/Pages 2 0 R
/Type /Catalog
>>
endobj `,
`2 0 obj 
<<
/Kids [3 0 R]
/Count 1
/Type /Pages
>>
endobj`,
`4 0 obj 
<<
/Font 
<<
/F0 
<<
/BaseFont /Times-Roman
/Subtype /Type1
/Type /Font
>>
>>
>>
endobj `,
`3 0 obj 
<<
/Parent 2 0 R
/MediaBox [0 0 595 842]
/Resources 4 0 R
/Contents 5 0 R
/Type /Page
>>
endobj `,
`5 0 obj 
<<
/Length 59
>>
stream
1. 0. 0. 1. 50. 720. cm
BT
/F0 36 Tf
(Hello, world!) Tj
ET

endstream 
endobj`
    ];
    let bottom =
`xref
trailer

<<
/Root 1 0 R
/Size 6
>>
startxref
0
%%EOF`;
    data += head+'\n';
    obj.forEach((objt) => {
        data += objt+'\n';
    });
    data+=bottom+'\n';
//    data = lines;
    fs.writeFile(process.argv[3], data, function (err) {
        if (err) {
            throw err;
        }
      });
}


*/

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
/*
class StreamPO {
    constructor() {}
}*/
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
class PdfGenerator {
    constructor() {
        this.IRs = new IndirectReferences();
        
    }
    import(filename) {

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
class TextStreamPO extends StringStreamPO {
    constructor(arr_string, fontName, fontSize, startX, startY,textLeading) {
    //arr_string ...  string の配列
        super();
        super.add("BT");
        super.add(`${new NamePO(fontName)} ${fontSize} Tf`);
        if (startX != undefined && startY != undefined)
            super.add(`${startX} ${startY} Td`);
        if (textLeading != undefined)
            super.add(`${textLeading} TL`);
        arr_string.forEach((string, idx) => {
            let str = `${new StringPO(string).toString()} Tj`;
            if (idx + 1 != arr_string.length)
                str += " T*";//改行記号
            super.add(str);
        });
    }
/*    addLine(line) {
        super.add(line);
    }*/
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
/*
function generateDictionaryPO_jp_koz_font() {
    const dicPO = new DictionaryPO();
    const dicPO2 = new DictionaryPO();
    const dicPO3 = new DictionaryPO();

    dicPO3.add(new NamePO("Type"), new NamePO("FontDescriptor"));
    dicPO3.add(new NamePO("FontName"),new NamePO("KozMinPr6N-Regular"));
    dicPO3.add(new NamePO("Flags"), new NumberPO(4));
    dicPO3.add(new NamePO("FontBox"), new ArrayPO(new NumberPO(-437),new NumberPO(-340),new NumberPO(1147),new NumberPO(1317)));
    dicPO3.add(new NamePO("ItalicAngle"), new NumberPO(0));
    dicPO3.add(new NamePO("Ascent"), new NumberPO(1317));
    dicPO3.add(new NamePO("Descent"), new NumberPO(-349));
    dicPO3.add(new NamePO("CapHeight"), new NumberPO(742));
    dicPO3.add(new NamePO("StemV"), new NumberPO(80));

    dicPO2.add(new NamePO("Registry"),new HarfWidthStringPO("Adobe"));
    dicPO2.add(new NamePO("Ordering"),new HarfWidthStringPO("Japan1"));
    dicPO2.add(new NamePO("Supplement"), new NumberPO(6));

    dicPO.add(new NamePO("Type"), new NamePO("Font"));
    dicPO.add(new NamePO("Subtype"), new NamePO("CIDFontType0"));
    dicPO.add(new NamePO("/BaseFont"),new NamePO("KozMinPr6N-Regular"));
    dicPO.add(new NamePO("CIDSystemInfo"),dicPO2);
    dicPO.add(new NamePO("FontDescriptor"), dicPO3);

    return dicPO;
}*/

function writeSampleTest() {
    const pg = new PdfGenerator();
    const documentCatalog = pg.IRs.add();
    const pageTree = pg.IRs.add();
    const page = pg.IRs.add();
    const font = pg.IRs.add();
    const textStream = pg.IRs.add();
    const fontDescriptor = pg.IRs.add();
    fontDescriptor.add(new StringToString(msGothicDicString));

    //ドキュメントカタログ
    documentCatalog.add(new DocumentCalalogDictionaryPO(pageTree));
        //new DocumentCalalogDictionaryPO(pageTreePO);

    //ページツリー
    pageTree.add(new PageTreeDictionaryPO(new ArrayPO(page)));
        //new PageTreeDictionaryPO(arrPO_kids);
    
    //ページ
    page.add(new PageDictionaryPO(pageTree, font, textStream));
        //new PageDictionaryPO(parentPO,resourcesPO,contensPO);

    //フォント
    const fontName = "F0";
//    const fontDicPO = new  FontDictionaryPO(fontName, "Times-Roman", "Type1");
//    const fontDicPO = new  FontDictionaryPO(fontName, "KozMinPro6N-Regular", "Type0","UniJIS-UTF16-H",new ArrayPO( generateDictionaryPO_jp_koz_font()));
//    font.add(fontDicPO);
    font.add(new FontDictionaryPO(
        fontName,
        "#82l#82r#83S#83V#83b#83N",
        "Type0", "UniJIS-UTF16-H",
        new ArrayPO(fontDescriptor)
    ));
        //new FontDictionaryPO(fontName,baseFont,subtype,encoding,arrPO_fontDescriptor);
    
    //描画
    /*
    const arr = new Array();
    for (let i = 0; i < 52; i++)
        arr.push("半角文字はだめなのかなＡaaAAああ");
    */
    const arr = splitLines();
    const strm = new TextStreamPO(arr,fontName,12,52.5,842-57,14);
    //new TextStreamPO(arr_string, fontName, fontSize, startX, startY,textLeading)
    textStream.add(strm);


    pg.testWriter();
}


writeSampleTest();