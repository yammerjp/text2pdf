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
const LINE_WIDTH_MAX = 84;
const fs = require("fs");

function splitPage() {
    const text = fs.readFileSync(process.argv[2], CHARACTOR_ENCODING);
    const lines = new Array();
    
    for (let i = 0, j = 0, lineWidth = 0, max = text.length; i < max; i++) {
        lineWidth += (isHalfWidth(text.charCodeAt(i)) ? 1 : 2);
        if (i == max - 1|| text[i] == "\n" || lineWidth >= LINE_WIDTH_MAX  || (lineWidth==LINE_WIDTH_MAX-1&&!(isHalfWidth(text.charCodeAt(i+1))))) {
            let line = text.slice(j+1, i+1);
            line = line.replace(/\r?\n/g, '');
            lines.push(line);
            j = i;
            lineWidth = 0;
        }
    }
    writePDF(lines.join("\n"));
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
class StringPO extends PdfObject{
    toString() {
        let str = "<";
        for (let i = 0; i < this.content.length; i++) {
            str += this.content.charCodeAt(i).toString(16);
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
}/*
class StreamPdfObject {
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

class IndirectReferences {
    constructor() {
        this.arr = new Array();
        this.arr.push(new IndirectReference0());
    }
    add() {
        const newIR = new IndirectReference(this.arr.length);
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

class StringStreamPdfObject {
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

class PDFGenerator {
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

const pg = new PDFGenerator();
const ir1 = pg.IRs.add();
const ir2 = pg.IRs.add();
const ir3 = pg.IRs.add();
const ir4 = pg.IRs.add();
const ir5 = pg.IRs.add();

const dict1 = new DictionaryPO();
dict1.add(new NamePO("Pages"),ir2);
dict1.add(new NamePO("Type"),new NamePO("Catalog"));
ir1.add(dict1);



const dict2 = new DictionaryPO();
dict2.add(new NamePO("Kids"), new ArrayPO(ir3));
dict2.add(new NamePO("Count"), new NumberPO(1));
dict2.add(new NamePO("Type"),new NamePO("Pages"));
ir2.add(dict2);


const dict4_3 = new DictionaryPO();
dict4_3.add(new NamePO("BaseFont"),new NamePO("Times-Roman"));
dict4_3.add(new NamePO("Subtype"),new NamePO("Type1"));
dict4_3.add(new NamePO("Type"), new NamePO("Font"));
const dict4_2 = new DictionaryPO();
dict4_2.add(new NamePO("F0"),dict4_3);
const dict4_1 = new DictionaryPO();
dict4_1.add(new NamePO("Font"),dict4_2);
ir4.add(dict4_1);

const dict3 = new DictionaryPO();
dict3.add(new NamePO("Parent"), ir2);
dict3.add(new NamePO("MediaBox"), new ArrayPO(new NumberPO(0), new NumberPO(0), new NumberPO(595), new NumberPO(842)));
dict3.add(new NamePO("Resources"), ir4);
dict3.add(new NamePO("Contents"), ir5);
dict3.add(new NamePO("Type"), new NamePO("Page"));
ir3.add(dict3);

const strm = new StringStreamPdfObject();
strm.add("1. 0. 0. 1. 50. 720. cm");
strm.add("BT");
strm.add("/F0 36 Tf");
strm.add("(Hello, world!) Tj");
strm.add("ET");

ir5.add(strm);

pg.testWriter();

/*
const indiRef = new IndirectReference(3);
const obj = new DictionaryPO();
obj.add(new NamePO("Kids"), new ArrayPO(indiRef));
obj.add(new NamePO("Count"), new NumberPO(1));
obj.add(new NamePO("Type"),new NamePO("Pages"));
console.log(obj.toString());*/
/*
const obj1 = new IndirectReference(1);
obj1.add(new NamePO("Dog"));
const obj2 = new IndirectReference(2);
const dict = new DictionaryPO();
dict.add(new NamePO("Name"), new StringPO("Pot i"));
dict.add(new NamePO("Age"), new NumberPO(5));
dict.add(new NamePO("Male"),new BooleanPO(true));
obj2.add(dict);

const arr = new ArrayPO(obj1, obj2);
console.log(obj1.define());
console.log(obj2.define());
console.log(arr.toString());

*/
/*test
const dict = new Dict({ "/Type": "Font" });
console.log(dict.toString());
const arr = new Arr();
arr.push(1);
arr.push(2);
arr.push(3);
console.log(arr.toString());
*/


/*
const sspo = new StringStreamPdfObject();
sspo.add(`1. 0. 0. 1. 50. 700. cm\nBT\n/F0 32. Tf\n(Hello, world!) Tj\nET`);
console.log(sspo.toString());
*/