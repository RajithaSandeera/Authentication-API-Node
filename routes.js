import { Router } from 'express';
import { body, header } from 'express-validator';
import controller, { validate, fetchUserByEmailOrID } from './controller.js';

const routes = Router({ strict: true });

// Token Validation Rule
const tokenValidation = (isRefresh = false) => {
    let refreshText = isRefresh ? 'Refresh' : 'Authorization';

    return [
        header('Authorization', `Please provide your ${refreshText} token`)
            .exists()
            .not()
            .isEmpty()
            .custom((value, { req }) => {
                if (!value.startsWith('Bearer') || !value.split(' ')[1]) {
                    throw new Error(`Invalid ${refreshText} token`);
                }
                if (isRefresh) {
                    req.headers.refresh_token = value.split(' ')[1];
                    return true;
                }
                req.headers.access_token = value.split(' ')[1];
                return true;
            }),
    ];
};

// Register a new User
routes.post(
    '/signup',
    [
        body('name')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Name must not be empty.')
            .isLength({ min: 3 })
            .withMessage('Name must be at least 3 characters long')
            .escape(),
        body('email', 'Invalid email address.')
            .trim()
            .isEmail()
            .custom(async (email) => {
                const isExist = await fetchUserByEmailOrID(email);
                if (isExist.length)
                    throw new Error(
                        'A user already exists with this e-mail address'
                    );
                return true;
            }),
        body('password')
            .trim()
            .isLength({ min: 4 })
            .withMessage('Password must be at least 4 characters long'),
    ],
    validate,
    controller.signup
);

// Login user through email and password
routes.post(
    '/login',
    [
        body('email', 'Invalid email address.')
            .trim()
            .isEmail()
            .custom(async (email, { req }) => {
                const isExist = await fetchUserByEmailOrID(email);
                if (isExist.length === 0)
                    throw new Error('Your email is not registered.');
                req.body.user = isExist[0];
                return true;
            }),
        body('password', 'Incorrect Password').trim().isLength({ min: 4 }),
    ],
    validate,
    controller.login
);

// Get the user data by providing the access token
routes.get('/profile', controller.getUser);

// Get new access and refresh token by providing the refresh token
routes.get(
    '/refresh',
    tokenValidation(true),  
    validate,
    controller.refreshToken
);

routes.get('/userDetails', tokenValidation(false), controller.getUserDetails);
routes.post(
    '/userDetails',
    [
            body("userId", "User ID must not be empty.").trim().not().isEmpty().escape(),
            body("firstName", "First name must not be empty.").trim().not().isEmpty().escape(),
            body("lastName", "Last name must not be empty.").trim().not().isEmpty().escape(),
            body("religion", "Religion must not be empty.").trim().not().isEmpty().escape(),
            body("gender", "Gender must not be empty.").trim().not().isEmpty().escape(),
            body("ethnics", "Ethnics must not be empty.").trim().not().isEmpty().escape(),
            body("civilState", "Civil state must not be empty.").trim().not().isEmpty().escape(),
            body("height", "Height must not be empty.").trim().not().isEmpty().escape(),
            body("profession", "Profession must not be empty.").trim().not().isEmpty().escape(),
            body("city", "City must not be empty.").trim().not().isEmpty().escape(),
            body("country", "Country must not be empty.").trim().not().isEmpty().escape(),
            body("district", "District must not be empty.").trim().not().isEmpty().escape(),
            body("fEthnics", "Father's Ethnics must not be empty.").trim().not().isEmpty().escape(),
            body("fCaste", "Father's Caste must not be empty.").trim().not().isEmpty().escape(),
            body("fReligion", "Father's Religion must not be empty.").trim().not().isEmpty().escape(),
            body("fProfession", "Father's Profession must not be empty.").trim().not().isEmpty().escape(),
            body("fCountry", "Father's Country must not be empty.").trim().not().isEmpty().escape(),
            body("mEthnics", "Mother's Ethnics must not be empty.").trim().not().isEmpty().escape(),
            body("mCaste", "Mother's Caste must not be empty.").trim().not().isEmpty().escape(),
            body("mReligion", "Mother's Religion must not be empty.").trim().not().isEmpty().escape(),
            body("mProfession", "Mother's Profession must not be empty.").trim().not().isEmpty().escape(),
            body("birthday", "Birthday must not be empty.").trim().not().isEmpty().escape(),
            body("birthCountry", "Birth Country must not be empty.").trim().not().isEmpty().escape(),
            body("birthCity", "Birth City must not be empty.").trim().not().isEmpty().escape(),
            body("birthTime", "Birth Time must not be empty.").trim().not().isEmpty().escape(),
            body("phoneNumber", "Phone number must not be empty.").trim().not().isEmpty().escape(),
            body("email", "Email must not be empty.").trim().not().isEmpty().isEmail().escape(),
            body("createdAt", "Created at must not be empty.").trim().not().isEmpty().escape(),
            body("id", "Foreign Key must not be empty.").trim().not().isEmpty().escape()

    ],
    validate,
    controller.createDetails
);

export default routes;
