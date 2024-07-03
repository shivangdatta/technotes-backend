const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ mssg: "Bad request: all fields are required" });
  }

  const foundUser = await User.findOne({ username }).exec();

  if (!foundUser || !foundUser.active) {
    return res.status(401).json({ mssg: "Unauthorized: no access to username" });
  }

  const match = await bcrypt.compare(password, foundUser.password); // Added await here

  if (!match) {
    return res.status(401).json({ mssg: "Unauthorized: incorrect password" });
  }

  const accessToken = jwt.sign(
    {
      "UserInfo": {
        "username": foundUser.username,
        "roles": foundUser.roles
      }
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { "username": foundUser.username },
    process.env.REFRESH_TOKEN_SECRET, // Changed to REFRESH_TOKEN_SECRET
    { expiresIn: '7d' }
  );

  res.cookie('jwt', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({ accessToken });
});

const refresh = asyncHandler(async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    return res.status(401).json({ mssg: "Unauthorized: No cookie found" });
  }

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) return res.status(403).json({ mssg: "Forbidden" }); // Changed to 403 Forbidden

      const foundUser = await User.findOne({ username: decoded.username }).exec();

      if (!foundUser) return res.status(401).json({ mssg: "Unauthorized" });

      const accessToken = jwt.sign(
        {
          "UserInfo": {
            "username": foundUser.username,
            "roles": foundUser.roles
          }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
      );

      res.json({ accessToken });
    }
  );
});

const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); // No content

  res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
  res.json({ mssg: 'Cookie cleared' });
};

module.exports = {
  login,
  refresh,
  logout
};
