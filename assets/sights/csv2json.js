const path = require('path')
const csvFilePath= path.join(__dirname, 'DSIGHT_1.csv')
const csv=require('csvtojson')
csv({
    noheader: true
})
.fromFile(csvFilePath)
.then((jsonObj)=>{
    const dataset = jsonObj.map(obj => {
        // Build postal code from two fields
        const postalCode = obj.field16 && obj.field17
            ? `${obj.field16}-${obj.field17}`
            : '';

        return {
            id: obj.field1,
            name: obj.field9,
            name_kana: obj.field10,
            alt_name: obj.field11 || '',
            alt_name_kana: obj.field12 || '',
            description: obj.field13,
            postal_code: postalCode,
            address: obj.field18 || '',
            tel: obj.field19 || '',
            fax: obj.field20 || '',
            accessibility: obj.field21 || '',
            opening_time: obj.field22 || '',
            closing_time: obj.field24 || '',
            duration: obj.field25 || '',
            holiday: obj.field26 || '',
            business_hours: obj.field27 || '',
            price: obj.field28 || '',
            notes: obj.field29 || '',
            photo: obj.field30 || ''
        };
    });
    console.log(JSON.stringify(dataset));
})