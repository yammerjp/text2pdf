function devide(line,harfWidthFont,fullWidthFont) {
    const str_arr = new Array();
    const font_arr = new Array();
    let str = "";
    let wasHarfWidth = IsHalfWidth(line.charCodeAt(0));
    for (let i = 0; i < line.length; i++){
        const isHalfWidth = IsHalfWidth(line.charCodeAt(i));
        if (isHalfWidth != wasHarfWidth) {
            str_arr.push(str);
            str = "";
            font_arr.push(wasHarfWidth ? harfWidthFont : fullWidthFont);
            wasHarfWidth = isHalfWidth;
        }
        str += line[i];
    }
    str_arr.push(str);
    font_arr.push(wasHarfWidth ? harfWidthFont : fullWidthFont);
    return [str_arr,font_arr];
}

const [strs, fonts] = devide("ああ、きれい。is 'Oh,beautiful.'ということになる.　OK?", 'a ', 'あ');
strs.forEach((str, idx) => {
    console.log(`${fonts[idx]} ----- ${str}`);
});


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