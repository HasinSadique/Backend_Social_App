const client = require('./connection.js')
const express = require('express')
const app = express();
app.use(express.json({ extended: false }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Backend server started at port: " + port);
});
client.connect();

// --------------------------------------
const fs = require('fs');
const { Console } = require('console');
var currentUser;

// --------------------------------------

//load currentUser
fs.readFile('./data/currentUser.json', 'utf-8', (err, jsonString) => {
    if (!err) {
        const data = JSON.parse(jsonString);
        if (data.username != '') {
            currentUser = data.username;
            console.log(`User '${currentUser}' is currently  Looged in.`);
        } else {
            console.log("Log into your account first.");
        }
    }
});

//signup
app.post("/signup", async(req, res) => {
    var { username, password, retype_Password } = req.body;

    console.log("before: " + username);
    username = username.toLowerCase();
    console.log("after: " + username);

    if (password == retype_Password) {
        console.log("Password Match proceed to registration");
        //check username already exists?
        let queryCheck = `SELECT * 
        FROM "Users" 
        where "Username"='${username}';`;

        client.query(queryCheck, (err, result) => {
            if (!err) {
                if (result.rows[0] == null) {
                    let queryInsert = `INSERT INTO public."Users"(
                        "Username", "Password")
                        VALUES ('${username}', '${password}');`;

                    client.query(queryInsert, (err, result) => {
                        if (!err) {
                            console.log("User sign-up complete.");
                            //create a table for this user
                            createUserTable(username);
                        } else {
                            console.log(err);
                        }
                    });
                } else {
                    console.log("username already exist.");
                }

            } else {
                console.log(err);
            }
        });
        //create json object
        //store values in that object
        //once complete go to signup 
    } else {
        console.log("Password Mismatch, Try again.");
    }
});

//login
app.post("/login", async(req, res) => {
    const { username, password } = req.body;
    console.log(username);
    console.log(password + "\n");

    if (currentUser == null) {
        //If not Logged In
        let queryLogin = `SELECT * FROM "Users" 
                where "Username"='${username}';`;

        client.query(queryLogin, (err, result) => {
            if (!err) {
                if ((result.rows[0] != undefined) && (username == result.rows[0]['Username'])) {
                    if (password == result.rows[0]['Password']) {
                        const newObject = {
                            username: username,
                            password: password
                        };
                        fs.writeFile('./data/currentUser.json', JSON.stringify(newObject), err => {
                            if (err) {
                                console.log(err);
                            } else {
                                currentUser = username;
                                res.send("Logged in. Going To Homepage.....");
                            }
                        });

                    } else {
                        res.send("Incorrect Password.");
                    }
                } else {
                    res.send("Account with this username cannot be found.");
                }
            } else {
                console.log(err);
            }
        });

    } else {
        res.send("User Already logged in, Going to homepage......");
    }
});

//Log Out
app.get("/logout", async(req, res) => {
    if (currentUser != null) {
        const newObject = {
            username: '',
            password: ''
        };
        fs.writeFile('./data/currentUser.json', JSON.stringify(newObject), err => {
            if (err) {
                console.log(err);
            } else {
                currentUser = '';
                res.send("Logged out. Going To Login Page.....");
            }
        });
    } else {
        res.send("No user Looged In")
    }
});
//Post insert
app.post("/insertPost", async(req, res) => {
    if (currentUser != null) {
        const { post } = req.body;
        let ts = Date.now();
        let currentDate = new Date();

        let date = currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getDate();
        let time = currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();

        console.log("\n" + date);
        console.log(time);

        let queryInsertPost = `INSERT INTO public."Posts"(
            "Username", "Post", "Posted_Date", "Posted_Time")
            VALUES ('${currentUser}', '${post}', '${date}', '${time}');`

        client.query(queryInsertPost, (err, result) => {
            if (!err) {
                res.send("Post inserted successfully.")
            } else {
                console.log(err);
                res.send("Problem inserting post into db.");
            }
        })

    } else {
        res.send("Error Posting without current user. Please Login.")
    }
});
//homepage Load complete
app.get("/homepage-load", async(req, res) => {

    let queryPostSelect = `SELECT * 
    FROM (
        Select * From public."Posts"
        ORDER BY "Posted_Time" DESC    
    ) as OrderedDate
    ORDER BY "Posted_Date" DESC`;

    let queryFriendsPost = `SELECT *
    FROM (select * from "Posts" ORDER BY "Posted_Time" DESC) as OrderedTime
    inner join "sabbir" on "Username" = "FriendsWith"
    order by "Posted_Date" DESC`

    client.query(queryFriendsPost, (err, result) => {
        if (!err) {
            res.send(result.rows);
        } else {
            console.log(err);
            res.send("Error Loading news feed.")
        }
    });
});

//AddFriend or Use for following 
app.post("/add-as-friends", async(req, res) => {
    const { friendUsername } = req.body;

    console.log(friendUsername);
    let querySearchFriends = `INSERT INTO public.${currentUser}(
        "FriendsWith")
        VALUES ('${friendUsername}');`

    client.query(querySearchFriends, (err, result) => {
        if (!err) {
            res.send(friendUsername + " added to your friend list.");
        } else {
            console.log("\nError\n");
            console.log(err);
        }
    });
});

//metod to create a table of a particular user
function createUserTable(username) {

    let queryCreateUserTable = `CREATE TABLE IF NOT EXISTS ${username}
    (
        "ID" integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
        "FriendsWith" text COLLATE pg_catalog."default",
        CONSTRAINT "${username}" PRIMARY KEY ("ID"),
        CONSTRAINT "FriendsWith" FOREIGN KEY ("FriendsWith")
            REFERENCES public."Users" ("Username") MATCH SIMPLE
            ON UPDATE NO ACTION
            ON DELETE NO ACTION
    )`

    client.query(queryCreateUserTable, (err, result) => {
        if (!err) {
            console.log("User table created.")
        } else {
            console.log("\nError\n");
            console.log(err);
        }
    });
}