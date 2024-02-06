import fs from 'fs';
import path from 'path';

const versionFilePath = path.resolve(__dirname, '../src/version/version.json');

const writeDateToVersion = () => {
  return {
    name: 'write-date-to-version',
    buildStart() {
      try {      
        const data = JSON.parse(fs.readFileSync(versionFilePath, 'utf-8'));

        // Modify the data as needed
        data.date = new Date().toUTCString();

        // Write the updated data back to the JSON file
        fs.writeFileSync(versionFilePath, JSON.stringify(data, null, 2));
      } catch (e) {
        console.error('Error updating date in version.json: ', e)
        throw e
      }
    }
  }
};

export default writeDateToVersion