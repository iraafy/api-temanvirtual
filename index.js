const express = require("express");
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
const response = require("./response");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");
const saltRounds = 10;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

app.use(bodyParser.json());

app.get("/", (req, res) => {
  response(200, "API Teman Virtual Ready To Use", "SUCCESS", res);
});

app.get("/users", async (req, res) => {
  const { data, error } = await supabase.from("users").select("*");
  if (error) {
    return response(500, null, error.message, res);
  }
  return response(200, data, "Get all user success", res);
});

app.get("/quotes", async (req, res) => {
  const { data, error } = await supabase.from("quotes").select("*");
  if (error) {
    return response(500, null, error.message, res);
  }
  return response(200, data, "Get all quotes success", res);
});

app.get("/article", async (req, res) => {
  const { data, error } = await supabase.from("article").select("*");
  if (error) {
    return response(500, null, error.message, res);
  }
  return response(200, data, "Get all article success", res);
});

app.post("/register", async (req, res) => {
  const { name, email, password, friend, profile } = req.body;
  try {
    const { data: checkEmail, error: checkEmailError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (checkEmailError) {
      console.error("Supabase Check Email Error:", checkEmailError);
      return response(500, null, "Internal Server Error", res);
    }

    if (checkEmail && checkEmail.length > 0) {
      const userData = {
        isSuccess: "error",
        message: "Email sudah terdaftar",
      };
      return response(200, userData, "Email sudah terdaftar", res);
    } else {
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const { data: newUser, error: newUserError } = await supabase
          .from("users")
          .insert({ name, email, password: hashedPassword, friend, profile })
          .select("*")
          .eq("email", email);

        if (newUserError) {
          return response(500, null, "Internal Server Error", res);
        }
        const responseUser = {
          isSuccess: "success",
          id: newUser[0].id,
          messege: "Data berhasil ditambahkan",
        };
        return response(200, responseUser, "Data berhasil ditambahkan", res);
      } catch (error) {
        return response(500, null, "Internal Server Error", res);
      }
    }
  } catch (error) {
    console.error("Supabase Check Email Error:", error);
    return response(500, null, "Internal Server Error", res);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (error) {
      return response(500, null, "Internal Server Error", res);
    }

    if (data.length === 1) {
      const user = data[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
      // const isPasswordValid = password === user.password;
      if (isPasswordValid) {
        const userData = {
          isSuccess: "success",
          id: user.id,
        };
        return response(200, userData, "Login successfully", res);
      } else {
        return response(401, null, "Invalid email/password", res);
      }
    } else {
      return response(404, null, "User not found", res);
    }
  } catch (error) {
    console.error(error);
    return response(500, null, "Internal Server Error", res);
  }
});

app.get("/users/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id);

    if (error) {
      return response(500, null, "Internal Server Error", res);
    }

    if (data.length === 1) {
      const userData = data[0];
      return response(200, userData, "Get detail artikel", res);
    } else {
      return response(404, null, "Artikel not found", res);
    }
  } catch (error) {
    console.error(error);
    return response(500, null, "Internal Server Error", res);
  }
});

app.get("/article/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const { data, error } = await supabase
      .from("article")
      .select("*")
      .eq("id", id);

    if (error) {
      return response(500, null, "Internal Server Error", res);
    }

    if (data.length === 1) {
      const artikelData = data[0];
      return response(200, artikelData, "Get detail artikel", res);
    } else {
      return response(404, null, "Artikel not found", res);
    }
  } catch (error) {
    console.error(error);
    return response(500, null, "Internal Server Error", res);
  }
});

app.get("/moods/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  try {
    const { data, error } = await supabase
      .from("moods")
      .select("*")
      .eq("user_id", user_id);

    if (error) {
      return response(500, null, "Internal Server Error", res);
    }

    if (data.length > 0) {
      return response(200, data, "Get moods data successfully", res);
    } else {
      return response(
        404,
        null,
        "No moods data found for the given user_id",
        res
      );
    }
  } catch (error) {
    console.error(error);
    return response(500, null, "Internal Server Error", res);
  }
});

app.get("/journal/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  try {
    const { data, error } = await supabase
      .from("journal")
      .select("*")
      .eq("user_id", user_id);

    if (error) {
      return response(500, null, "Internal Server Error", res);
    }

    if (data.length > 0) {
      return response(200, data, "Get journal data successfully", res);
    } else {
      return response(
        404,
        null,
        "No journal data found for the given user_id",
        res
      );
    }
  } catch (error) {
    console.error(error);
    return response(500, null, "Internal Server Error", res);
  }
});

app.post("/moods", async (req, res) => {
  const { user_id, mood, reason, timestamp } = req.body;
  try {
    const { data, error } = await supabase
      .from("moods")
      .insert([{ user_id, mood, reason, timestamp }])
      .select();
    if (error) {
      return response(500, null, "Internal Server Error", res);
    }

    if (data.length === 1) {
      const moods = data[0];
      const moodsData = {
        isSuccess: "success",
        id: moods.id,
      };
      return response(200, moodsData, "Data berhasil ditambahkan", res);
    } else {
      return response(404, null, "Moods not found", res);
    }
  } catch (error) {
    console.error(error);
    return response(500, null, "Internal Server Error", res);
  }
});

app.post("/journal", async (req, res) => {
  const { user_id, title, content, timestamp } = req.body;
  try {
    const { data, error } = await supabase
      .from("journal")
      .insert([{ user_id, title, content, timestamp }])
      .select();
    if (error) {
      return response(500, null, "Internal Server Error", res);
    }

    if (data.length === 1) {
      const journal = data[0];
      const journalData = {
        isSuccess: "success",
        id: journal.id,
      };
      return response(200, journalData, "Data berhasil ditambahkan", res);
    } else {
      return response(404, null, "Journal not found", res);
    }
  } catch (error) {
    console.error(error);
    return response(500, null, "Internal Server Error", res);
  }
});

app.put("/users", async (req, res) => {
  const { id, name, email, password, friend, profile } = req.body;
  try {
    const { data: checkEmail, error: checkEmailError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (checkEmailError) {
      console.error("Supabase Check Email Error:", checkEmailError);
      return response(500, null, "Internal Server Error", res);
    }

    if (checkEmail && checkEmail.length > 0) {
      const userData = {
        isSuccess: "error",
        message: "Email sudah terdaftar",
      };
      return response(200, userData, "Email sudah terdaftar", res);
    } else {
      try {
        const { data, error } = await supabase
          .from("users")
          .update({ name, email, password, friend, profile })
          .eq("id", id)
          .select();
        if (error) {
          return response(500, null, "Internal Server Error", res);
        }

        if (data.length === 1) {
          const userData = {
            isSuccess: "success",
            message: "Data berhasil diupdate",
          };
          return response(200, userData, "Update user successfully", res);
        }
      } catch (error) {
        return response(500, null, "Internal Server Error", res);
      }
    }
  } catch (error) {
    console.error("Supabase Check Email Error:", error);
    return response(500, null, "Internal Server Error", res);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;
