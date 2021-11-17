const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const dbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersDetails = `SELECT * FROM player_details;`;
  const dbResponse = await db.all(getPlayersDetails);
  response.send(
    dbResponse.map((eachPlayerDetails) =>
      dbObjectToResponseObject(eachPlayerDetails)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetails = `SELECT * FROM player_details WHERE 
    player_id = ${playerId};`;
  const dbResponse = await db.get(getPlayerDetails);
  response.send(dbObjectToResponseObject(dbResponse));
});
module.exports = app;

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  //console.log(playerName);
  const updatePlayerName = `UPDATE player_details SET player_name = '${playerName}' WHERE
    player_id = ${playerId};`;
  await db.run(updatePlayerName);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const dbResponse = await db.get(getMatchDetails);
  //response.send(dbResponse);
  response.send({
    matchId: dbResponse.match_id,
    match: dbResponse.match,
    year: dbResponse.year,
  });
});

const convertDbResponseToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetails = `SELECT match_details.match_id,match,year FROM
    match_details INNER JOIN player_match_score ON 
    match_details.match_id = player_match_score.match_id WHERE 
    player_id = ${playerId}`;
  const dbResponse = await db.all(getPlayerDetails);
  //response.send(dbResponse);
  response.send(
    dbResponse.map((eachPlayer) =>
      convertDbResponseToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetails = `SELECT player_details.player_id,player_details.player_name,SUM(score),SUM(fours),SUM(sixes) 
  FROM player_details INNER JOIN player_match_score ON
  player_details.player_id = player_match_score.player_id WHERE
  player_details.player_id = ${playerId}`;
  const dbResponse = await db.get(getPlayerDetails);
  //response.send(dbResponse);
  response.send({
    playerId: dbResponse.player_id,
    playerName: dbResponse.player_name,
    totalScore: dbResponse["SUM(score)"],
    totalFours: dbResponse["SUM(fours)"],
    totalSixes: dbResponse["SUM(sixes)"],
  });
});

const dbObjectToResponseObject1 = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerDetails = `SELECT player_details.player_id,
    player_details.player_name FROM player_details INNER JOIN 
    player_match_score ON player_details.player_id = 
    player_match_score.player_id WHERE player_match_score.match_id = ${matchId};`;
  const dbResponse = await db.all(getMatchPlayerDetails);
  //response.send(dbResponse);
  response.send(
    dbResponse.map((eachObject) => dbObjectToResponseObject1(eachObject))
  );
});
