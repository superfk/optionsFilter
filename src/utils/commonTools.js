const getLocalTime = (minusDay = 0) => {
    let d = new Date();
    d.setDate(d.getDate() - minusDay)
    var tzoffset = d.getTimezoneOffset() / 1440; //offset in day
    d.setDate(d.getDate() - tzoffset)
    var localISOTime = d
    return localISOTime;
}

const renderUnit = (unit) => {
    let mapUnit = unit;
    switch (unit) {
        case "degreeC":
            mapUnit = "℃";
            break;
        case "degreeF":
            mapUnit = "℉";
            break;
        case "Pa*s":
            mapUnit = "Pa⋅s";
            break;
        default:
    }
    return mapUnit;
}

const timeConverter = (UNIX_timestamp) => {
    var a = new Date(UNIX_timestamp * 1000);
    var t = a.toISOString();
    let datePart = t.slice(0, 10)
    let timePart = t.slice(11, 19)
    return `${datePart} ${timePart}`;
}

const getCSVSeparatorBasedOnLocale = () => {
    var n = 1.1;
    n = n.toLocaleString().substring(1, 2);
    return n === '.' ? ',' : ';';
}

const compactTime = (timeIn) => {
    let t = new Date(timeIn).toISOString();
    let datePart = t.slice(0, 10)
    let timePart = t.slice(11, 19)
    return `${datePart}${timePart}`;
}
const noFractionTime = (timeIn) => {
    let t = new Date(timeIn).toISOString();
    let datePart = t.slice(0, 10)
    let timePart = t.slice(11, 19)
    return `${datePart} ${timePart}`;
}

export { getLocalTime, renderUnit, timeConverter, getCSVSeparatorBasedOnLocale, compactTime, noFractionTime };