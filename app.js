const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

app.use(express.json());
const dbPath = path.join(__dirname, "covid19IndiaPortal.db");
let db = null;
const covid19IndiaPortalDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3006, () => {
      console.log("Server Running at http://localhost:3006");
    });
  } catch (e) {
    console.log(`DB error ${e.message}`);
  }
};

covid19IndiaPortalDbServer();

//const authenticationToken = (request,response,next){};

//API 1

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUser = `select * from user where username = '${username}';`;
  const dbUser = await db.get(selectUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched == true) {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "vineeth");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

//API 2

app.get("/states/", async (request, response) => {
  const getStatesQuery = `select * from state;`;
  const states = await db.all(getStatesQuery);
  const responseSates = states.map((state) => {
    return {
      stateId: state.state_id,
      stateName: state.state_name,
      population: state.population,
    };
  });
  response.send(responseSates);
});

//API 3

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `select * from state where state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  const responseState = (state) => {
    return {
      stateId: state.state_id,
      stateName: state.state_name,
      population: state.population,
    };
  };
  const result = responseState(state);
  response.send(result);
});

//API 4

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `insert into district (district_name,state_id,cases,cured,active,deaths)
    values('${districtName}',${stateId},'${cases}','${cured}','${active}','${deaths}');`;
  await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//API 5

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `select * from district where district_id =${districtId};`;
  const district = await db.get(getDistrictQuery);
  const responseDistrict = (district) => {
    return {
      districtId: district.district_id,
      districtName: district.district_name,
      stateId: district.state_id,
      cases: district.cases,
      cured: district.cured,
      active: district.active,
      deaths: district.deaths,
    };
  };
  const result = responseDistrict(district);
  response.send(result);
});

//API 6

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `delete from district where district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 7

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `update district set district_name = '${districtName}',
    state_id = ${stateId},
    cases = '${cases}',
    cured = '${cured}',
    active = '${active}',
    deaths = '${deaths}';`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 8

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatistics = `select sum(cases) as totalCases,
    sum(cured) as totalCured,
    sum(active) as totalActive,
    sum(deaths) as totalDeaths from district where state_id = ${stateId};`;
  const statistics = await db.get(getStatistics);
  response.send(statistics);
});
