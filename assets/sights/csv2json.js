const fs = require('fs');
const path = require('path')
const csvFilePath= path.join(__dirname, 'DSIGHT_1.csv')
const csv=require('csvtojson')

const headers = [
  'id', 'field2', 'field3', 'field4', 'field5', 'field6', 'field7', 'field8', 
  'name', 'name_kana', 'alt_name', 'alt_name_kana', 'description', 
  'field14', 'field15', 'postal_code_1', 'postal_code_2', 'address', 
  'tel', 'fax', 'accessibility', 'opening_time', 'field23', 'closing_time', 
  'duration', 'holiday', 'business_hours', 'price', 'notes', 'photo'
];

csv({
    noheader: true,
    headers: headers
})
.fromFile(csvFilePath)
.then((jsonObj)=>{
    const dataset = jsonObj.map(obj => {
        // Build postal code from two fields
        const postalCode = obj.postal_code_1 && obj.postal_code_2
            ? `${obj.postal_code_1}-${obj.postal_code_2}`
            : '';

        return {
            id: obj.id,
            name: obj.name,
            name_kana: obj.name_kana,
            alt_name: obj.alt_name || '',
            alt_name_kana: obj.alt_name_kana || '',
            description: obj.description,
            postal_code: postalCode,
            address: obj.address || '',
            tel: obj.tel || '',
            fax: obj.fax || '',
            accessibility: obj.accessibility || '',
            opening_time: obj.opening_time || '',
            closing_time: obj.closing_time || '',
            duration: obj.duration || '',
            holiday: obj.holiday || '',
            business_hours: obj.business_hours || '',
            price: obj.price || '',
            notes: obj.notes || '',
            photo: obj.photo || ''
        };
    });
    const outputPath = path.join(__dirname, '../../src/app/pages/sights/dataset/kyoto-sights.json');
    fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));
    console.log(`✅ Generated ${outputPath}`);
})