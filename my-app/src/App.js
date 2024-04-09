import { useState } from 'react';
import './App.css';
const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: 'us-west-2'
});


function App() {
  const [formData, setFormData] = useState({
    textInput: '',
    txtFile: null
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'txtFile' ? files[0] : value,
    });
  };

  async function uploadFileToS3(file) {
    const s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: { Bucket: 'input-bucket-sr-dev' }
    });

    const params = {
      Key: file.name,
      Body: file
    };

    try {
      const data = await s3.upload(params).promise();
      return data.Location;
    } catch (error) {
      console.log("Error occurred during file upload to S3 ", error);
      throw error; 
    }
  }

  async function invokeLambda(fileurl) {
    const data = {
      "text": formData.textInput,
      "url": fileurl
    };
    const url = "https://18sxz8g0r4.execute-api.us-west-2.amazonaws.com/file";
    
    try {
      const response = await fetch(url, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const responseData = await response.json();
      console.log(responseData); 
    } catch (error) {
      console.error("Error occurred while invoking lambda:", error);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (formData.txtFile) {
        console.log("Uploading file to S3");
        const fileUrl = await uploadFileToS3(formData.txtFile);
        console.log("File uploaded to S3:", fileUrl);
        await invokeLambda(fileUrl);
      } else {
        console.error("No file selected.");
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="textInput">Text input:</label>
      <input type="text" id="textInput" name="textInput" value={formData.textInput} onChange={handleChange} required/>
      <br/>
      <label htmlFor="txtFile">File input:</label>
      <input type="file" id="txtFile" name="txtFile" accept=".txt" onChange={handleChange} required/>
      <br />
      <button type="submit">Submit</button>
    </form>
  );

}

export default App;
