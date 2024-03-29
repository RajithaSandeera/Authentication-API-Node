import bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { validationResult, matchedData } from 'express-validator';
import { generateToken, verifyToken } from './tokenHandler.js';
import DB from './dbConnection.js';

const validation_result = validationResult.withDefaults({
    formatter: (error) => error.msg,
});

export const validate = (req, res, next) => {
    const errors = validation_result(req).mapped();
    if (Object.keys(errors).length) {
        return res.status(422).json({
            status: 422,
            errors,
        });
    }
    next();
};

// If email already exists in database
export const fetchUserByEmailOrID = async (data, isEmail = true) => {
    let sql = 'SELECT * FROM `users` WHERE `email`=?';
    if (!isEmail)
        sql = 'SELECT `id` ,`name`, `email` FROM `users` WHERE `id`=?';
    const [row] = await DB.execute(sql, [data]);
    return row;
};

export const fetchAllUserData = async () => {
    const [rows] = await DB.query("SELECT * FROM `users_data`");
    return rows;
}
export const getCount = async() => {
    let sqlCount = "SELECT COUNT (*) AS count FROM users_data"
    const [row] = await DB.execute(sqlCount)
    return row;
}
export const createUserData = async (data) => {
    const {
        userId,firstName,lastName,religion,gender,ethnics,civilState,height,profession,city,country,district,fEthnics,fCaste,fReligion,fProfession,fCountry,mEthnics,mCaste,mReligion,mProfession,birthday,birthCountry,birthCity,birthTime,phoneNumber,email,createdAt,id
    } = matchedData(data);
    try {
      let sql = `INSERT INTO 
                  users_data(userId, firstName, lastName, religion, gender, ethnics, civilState, height, profession, city, country, district, fEthnics, fCaste, fReligion, fProfession, fCountry, mEthnics, mCaste, mReligion, mProfession, birthday, birthCountry, birthCity, birthTime, phoneNumber, email, createdAt, id)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const [row] = await DB.execute(sql,  [
        userId,firstName,lastName,religion,gender,ethnics,civilState,height,profession,city,country,district,fEthnics,fCaste,fReligion,fProfession,fCountry,mEthnics,mCaste,mReligion,mProfession,birthday,birthCountry,birthCity,birthTime,phoneNumber,email,createdAt,id
    ]);
      return row;
    } catch (error) {
      console.error('Error in createUserData:', error);
      throw error; // rethrow the error for handling in the calling function
    }
  };
  

export default {
    signup: async (req, res, next) => {
        try {
            const { name, email, password } = matchedData(req);

            const saltRounds = 10;
            // Hash the password
            const hashPassword = await bcrypt.hash(password, saltRounds);

            // Store user data in the database
            const [result] = await DB.execute(
                'INSERT INTO `users` (`name`,`email`,`password`) VALUES (?,?,?)',
                [name, email, hashPassword]
            );
            res.status(201).json({
                status: 201,
                message: 'You have been successfully registered.',
                user_id: result.insertId,
            });
        } catch (err) {
            next(err);
        }
    },

    login: async (req, res, next) => {
        try {
            const { user, password } = req.body;
            const verifyPassword = await bcrypt.compare(
                password,
                user.password
            );
            if (!verifyPassword) {
                return res.status(422).json({
                    status: 422,
                    message: 'Incorrect password!',
                });
            }

            // Generating Access and Refresh Token
            const access_token = generateToken({ id: user.id });
            const refresh_token = generateToken({ id: user.id }, false);

            const md5Refresh = createHash('md5')
                .update(refresh_token)
                .digest('hex');

            // Storing refresh token in MD5 format
            const [result] = await DB.execute(
                'INSERT INTO `refresh_tokens` (`user_id`,`token`) VALUES (?,?)',
                [user.id, md5Refresh]
            );

            if (!result.affectedRows) {
                throw new Error('Failed to whitelist the refresh token.');
            }
            res.json({
                status: 200,
                access_token,
                refresh_token,
            });
        } catch (err) {
            next(err);
        }
    },

    getUser: async (req, res, next) => {
        try {
            // Verify the access token
            const accessToken = req.headers.access_token;
            if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
                return res.status(400).json({
                    status: 400,
                    message: 'Invalid access token provided',
                });
            }
            const data = verifyToken(accessToken);
            console.log(data)
            if (data?.status) return res.status(data.status).json(data);

            const user = await fetchUserByEmailOrID(data.id, false);
            if (user.length !== 1) {
                return res.status(404).json({
                    status: 404,
                    message: 'User Details not found',
                });
            }
            res.json({
                status: 200,
                user: user[0],
            });
        } catch (err) {
            next(err);
        }
    },
    // API with no using token
    getUserDetails: async (req, res, next) => {
        try {
            // const data = verifyToken(req.headers.access_token);
            // if (data?.status) return res.status(data.status).json(data);
            const userData = await fetchAllUserData();
            const count = await getCount()
            if (userData.length === 0) {
                return res.status(404).json({
                    status: 404,
                    message: 'users details not found'
                });
            }
            res.json({
                count: count[0].count,
                userData: userData
            })
        }
        catch (err) {
            next(err);
        };
    },

    refreshToken: async (req, res, next) => {
        try {
            const refreshToken = req.headers.refresh_token;
            // Verify the refresh token
            const data = verifyToken(refreshToken, false);
            if (data?.status) return res.status(data.status).json(data);

            // Converting refresh token to md5 format
            const md5Refresh = createHash('md5')
                .update(refreshToken)
                .digest('hex');

            // Finding the refresh token in the database
            const [refTokenRow] = await DB.execute(
                'SELECT * from `refresh_tokens` WHERE token=?',
                [md5Refresh]
            );

            if (refTokenRow.length !== 1) {
                return res.json({
                    status: 401,
                    message: 'Unauthorized: Invalid Refresh Token.',
                });
            }

            // Generating new access and refresh token
            const access_token = generateToken({ id: data.id });
            const refresh_token = generateToken({ id: data.id }, false);

            const newMd5Refresh = createHash('md5')
                .update(refresh_token)
                .digest('hex');

            // Replacing the old refresh token to new refresh token
            const [result] = await DB.execute(
                'UPDATE `refresh_tokens` SET `token`=? WHERE `token`=?',
                [newMd5Refresh, md5Refresh]
            );

            if (!result.affectedRows) {
                throw new Error('Failed to whitelist the Refresh token.');
            }

            res.json({
                status: 200,
                access_token,
                refresh_token,
            });
        } catch (err) {
            next(err);
        }
    },

    createUserDetails: async (req, res, next) => {
        try {
            const accessToken = req.headers.refresh_token;
            // Check if accessToken exists and is a non-empty string
            // if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
            //     return res.status(400).json({
            //         status: 400,
            //         message: 'Invalid access token provided',
            //     });
            // }
            console.log('checking token', accessToken)
            const data = verifyToken(accessToken);
            if (data?.status) return res.status(data.status).json(data);
            console.log('working11')
            const userData = await createUserData(req)
            console.log('working',userData)

           // Update the condition to check for userData
    if (!userData) {
        return res.status(404).json({
          status: 404,
          message: 'Enter user details failed',
        });
      }
  
      res.status(201).json({
        ok: 1,
        status: 201,
        message: 'Post has been created Successfully',
        post_id: userData.insertId, // Assuming insertId is the correct property
      });
    } catch (err) {
      console.error('Error in createUserDetails:', err);
      res.status(500).json({
        status: 500,
        message: 'Internal Server Error',
      });
    }
  },
    // createDetails: async (req, res, next) => {
    //     const {
    //         userId,firstName,lastName,religion,gender,ethnics,civilState,height,profession,city,country,district,fEthnics,fCaste,fReligion,fProfession,fCountry,mEthnics,mCaste,mReligion,mProfession,birthday,birthCountry,birthCity,birthTime,phoneNumber,email,createdAt,id
    //     } = matchedData(req);
    //     try {
    //         const data = verifyToken(req.headers.refresh_token);
    //         console.log('createDara', data)
            
    //         const [result] = await DB.execute(
    //             `INSERT INTO 
    //             users_data(userId, firstName, lastName, religion, gender, ethnics, civilState, height, profession, city, country, district, fEthnics, fCaste, fReligion, fProfession, fCountry, mEthnics, mCaste, mReligion, mProfession, birthday, birthCountry, birthCity, birthTime, phoneNumber, email, createdAt, id)
    //             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    //             [
    //                 userId,firstName,lastName,religion,gender,ethnics,civilState,height,profession,city,country,district,fEthnics,fCaste,fReligion,fProfession,fCountry,mEthnics,mCaste,mReligion,mProfession,birthday,birthCountry,birthCity,birthTime,phoneNumber,email,createdAt,id

    //             ]
    //         );
    //         res.status(201).json({
    //             ok: 1,
    //             status: 201,
    //             message: 'Post has been created Successfully',
    //             post_id: result.insertId,
    //         })
    //     }
    //     catch (e) {
    //         next(e);
    //     }
    // },



}