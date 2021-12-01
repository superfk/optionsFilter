const { ipcRenderer } = require("electron");
const appRoot = require('electron-root-path').rootPath;
const path = require('path');
const isDev = require('electron-is-dev');
const curLocalizationFolder = isDev ? path.join(appRoot, "public", "Localization",) : path.join(appRoot, 'Localization');
const curReportTemplateFolder = isDev ? path.join(appRoot, "public", "reports",) : path.join(appRoot, 'reports');

let viewer, report;

window.Stimulsoft.Base.StiLicense.key = "6vJhGtLLLz2GNviWmUTrhSqnOItdDwjBylQzQcAOiHm7FUo42VyTCgUIH3+OR7524M2Hcac3U3SxG3u+pLmozswmZ0" + 
"ssLVTNVzD5DEAVFCkCNNXkOl+0h2p6XaeqFJTIFtXMxODmyIoRkrIzbtk1XzDbSIwLNLCDy2X9uTwvD8FQXG3Oz3ga" + 
"ao1oXUoxn4HfRsMIetRkoyFfSTYpsaMfFT+SDYAhp2J/nVAxV8Uk5ToonZ46uEtCb2LvE/2X0+wo/lAihwg8JTzN4I" + 
"htTa9U1wcM9vakH8n7/yzq70u7htj56y+x2SGfgW+/dpy692VmcMTD+pZw3Px9ksP+FO9ZcNNC+BwhgShN3UZcGzjw" + 
"NsUSnJFCR/SmaA81XvPE4D8N6pRH8Um/PpAp089zWHS4xXnA5AEf5LGE/xPK8s4U8WXD7H9blNXiLpKbdt9d8ipwEP" + 
"I7jYLU5adei5JU16yt3egyGNWrYL3v3Luo3U3YzTrimKliXTIDU6LRpcKFPPxvxBj76aqULngSuXf5NQ0CRLT/fLEd" + 
"DlRoctXjKO+nPjVFr7xso0OBmaCZ1xBttdfv";

var options = new window.Stimulsoft.Viewer.StiViewerOptions();
options.appearance.scrollbarsMode = true;
options.appearance.fullScreenMode = true;

window.Stimulsoft.Base.Localization.StiLocalization.addLocalizationFile(path.join(curLocalizationFolder, 'en.xml'), false, 'en');
window.Stimulsoft.Base.Localization.StiLocalization.addLocalizationFile(path.join(curLocalizationFolder, 'de.xml'), false, 'de');
window.Stimulsoft.Base.Localization.StiLocalization.addLocalizationFile(path.join(curLocalizationFolder, 'zh-CHS.xml'), false, 'zh-CHS');
window.Stimulsoft.Base.Localization.StiLocalization.addLocalizationFile(path.join(curLocalizationFolder, 'zh-CHT.xml'), false, 'zh-CHT');
// Stimulsoft.System.NodeJs.localizationPath = "locales";

ipcRenderer.on('set-lang', (event, lang) => {
    let langName = 'en';
    switch (lang) {
        case 'en':
            langName = 'en'
            break;
        case 'de':
            langName = 'de'
            break;
        case 'zh_cn':
            langName = 'zh-CHS'
            break;
        case 'zh_tw':
            langName = 'zh-CHT'
            break;
        default:

    }
    window.Stimulsoft.Base.Localization.StiLocalization.cultureName = langName;
})

ipcRenderer.on('import-data-to-viewer', (event, data, reportFileName = 'Report.mrt') => {

    // Create the report viewer with specified options
    viewer = new window.Stimulsoft.Viewer.StiViewer(options, "StiViewer", false);

    // Create a new report instance
    report = new window.Stimulsoft.Report.StiReport();

    // Load report from url
    try {
        report.loadFile(path.join(curReportTemplateFolder , reportFileName));
        // Assign report to the viewer, the report will be built automatically after rendering the viewer
        viewer.report = report;

        // Create new DataSet object
        var dataSet = new window.Stimulsoft.System.Data.DataSet("Data");
        // Load JSON data file from specified URL to the DataSet object
        dataSet.readJson(data);
        // Remove all connections from the report template
        report.dictionary.databases.clear();
        // Register DataSet object
        report.regData("Data", "Data", dataSet);

    } catch {

    } finally {
        viewer.renderHtml('viewerContent');
    }

})