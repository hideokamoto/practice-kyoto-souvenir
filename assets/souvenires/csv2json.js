const path = require('path')
const csvFilePath= path.join(__dirname, 'DSOURVENIR_0.csv')
const csv=require('csvtojson')
csv({
    noheader: true
})
.fromFile(csvFilePath)
.then((jsonObj)=>{
    const dataset = jsonObj.map(obj => ({
        id: obj.field1,
        name: obj.field9 || '',
        name_kana: obj.field10 || '',
        description: obj.field13 || ''
    }));
    console.log(JSON.stringify(dataset));
})