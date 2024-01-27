// Google sheets api application 
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const { google } = require('googleapis');
// Id Sheet
const id = '1XpWc5_cMwRJ-E7qvVV_mEcHwm6OU6eWinRgjIMkn4os';
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), './assets/credentials.json');

/**
 * This method calculates student approval and returns their status along with their final exam grade.
 * If he has more than 25% of absences in relation to the number of classes he is "Reprovado por Falta".
 * If the average of the three grades is less than 5, it is "Reprovado por Nota".
 * And if it has an average greater than 7 it is "Aprovado".
 * In the 3 cases above, your nef (Final exam score) will be equal to 0.
 * 
 * In the case of having an average greater than or equal to 5 and less than 7, he will have his nef (Final exam grade) calculated as the sum of the third grade with the average, divided by two, if the nef is greater than 5 the student is "Aprovado", otherwise,"Reprovado por Nota Final"
 * @param absences Number of student absences
 * @param p1 Student's first grade
 * @param p2 Student's secund grade
 * @param p3 Student's third grade
 * @param numberClasses Total number of classes
 * @returns {status, nef} Pass status or disapproval , and the final exam grade
 */
function approvalCalc(absences, p1, p2, p3, numberClasses) {
  if (absences > (numberClasses * 0.25)) {
      return ["Reprovado por Falta", 0]
  } else {
      const avarage = (p1 + p2 + p3) / 3;

      if (avarage < 5) {
          return ["Reprovado por Nota", 0]
      } else if (avarage >= 7) {
          return ["Aprovado", 0]
      } else {
          // As the instructions do not explain the formula correctly (in fact there is only the approval criterion in the case of a Final Exam, at least in mine it is like this, I put it as (grade_3 + average) / 2
          const naf = Math.ceil((p3 + avarage) / 2); 
          if (5 <= naf) {
              return ["Aprovado", naf]
          } else {
              return ["Reprovado por Nota Final", naf]
          }
      }
  }
}

/**
 * The function below performs the following operations:
 * First it obtains the data from the spreadsheet  relating to the Matrícula, Aluno, Faltas, P1, P2 and P3 columns.
 * 
 * Then it searches for the data relating to the total number of classes and converts it to an integer.
 * 
 * After this, a map is created, and within this map the approval calculation is carried out using the approvalCalc function, and its result will be added to the statusList and nefList lists.
 * 
 * After these operations, statusList and nefList data will be added to the worksheet at the defined interval.
 * 
 * @param {*} auth Authorization to work on the spreadsheet obtained through the credentials.json file
 * @returns 
 */
async function spreadsheetUpdate(auth) {

  const sheets = google.sheets({ version: 'v4', auth });

  const dataSheet = await sheets.spreadsheets.values.get({
    spreadsheetId: `${id}`,
    range: 'dados',
  });

  console.log("Obtaining student data relating to the Matrícula, Aluno, Faltas, P1, P2 and P3 columns \n");
  const dataStudents = dataSheet.data.values; 
  dataStudents.map(tuple => {
    console.log(tuple)
  });

  console.log("\nObtaining data on the number of classes");
  
  const numberClassesRes = await sheets.spreadsheets.values.get({
    spreadsheetId: `${id}`,
    range: 'faltas',
  });

  const numberClasses = parseInt(numberClassesRes.data.values.toString().match(/\d+/)[0], 10);

  console.log("\nNumber classes: "+numberClasses)
  
  if (!dataStudents || dataStudents.length === 0) {
    console.log("No data found.");
    return;
  }

  const statusList = [];
  const nefList = [];

  console.log("\nStarting calculation of averages and defining Status and Nef's");

  dataStudents.map(tuple => {

    const abscences = tuple[2];
    const p1 = tuple[3];
    const p2 = tuple[4];
    const p3 = tuple[5];

    const [status, nef] = approvalCalc(abscences, p1, p2, p3, numberClasses);

    console.log("Matrícula :"+tuple[0]+"; Status: "+status+"; Nota de Exame Final: "+nef)

    statusList.push(status);
    nefList.push(nef)
  });

  console.log("\nFinalized calculations")

  console.log("Starting to insert Nef data into the spreadsheet")
  const updateStatus = sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: 'situacao',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      range: 'situacao',
      majorDimension: 'COLUMNS',
      values: [statusList],
    },
  });
  console.log((await updateStatus).statusText)

  console.log("Starting to insert Nef data into the spreadsheet")
  const updateNef = sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: 'nef',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      range: 'nef',
      majorDimension: 'COLUMNS',
      values: [nefList],
    },
  });
  console.log((await updateNef).statusText)

  console.log("\nData entered into the spreadsheet and finished program")
}

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile('./assets/credentials.json');
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}


authorize().then(spreadsheetUpdate).catch(console.error);