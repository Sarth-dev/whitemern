const express = require('express');
const path = require('path');
const app = express();
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const userModel = require("./models/user");
const Employee = require("./models/employee");

app.set("view engine", "ejs");
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname ,"public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));




const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});
const upload = multer({ storage: storage });

app.get("/",isLoggedIn, (req,res) => {
   const user = req.user || null ;
    res.render('index', { currentPage: 'home', user });
})

app.get("/login", (req,res) => {
    res.render('login');
})

app.get("/register", (req,res) => {
    res.render('register');
})

app.post("/register", async (req,res) => {
    const { username , password, email } = req.body;
    let user = await userModel.findOne({email : email});
    if(user) return res.status(401).send("You already have an account,please log in");
    bcrypt.genSalt(10,(err,salt) => {
        bcrypt.hash(password , salt, async (err,hash) => {
            let user = await userModel.create({
                 username,
                 email,
                 password : hash
            });

           let token =  jwt.sign({email : email, userid: user._id}, "shhhhh");
           res.cookie("token", token);
           res.redirect("/login");
        })
    })
})


app.post("/login",  async (req,res) => {
    const {username , password , email } = req.body;
    let user = await userModel.findOne({ username : username });
    if(!user){
        return res.send("Email or password Incorrect")
    }

    bcrypt.compare(password , user.password , function(err , result){
        if(result) {
            let token =  jwt.sign({username : username, userid: user._id}, "shhhhh");
            res.cookie("token", token);
            res.status(200).redirect("/");
        }
        else res.redirect('/login');
    })
})


function isLoggedIn(req, res, next) {
    if (!req.cookies || !req.cookies.token) {
        return res.redirect('/login');
    }

    try {
        let data = jwt.verify(req.cookies.token, "shhhhh"); // Replace "shhhhh" with your actual secret key
        req.user = data;
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
}

app.get('/createEmployee',isLoggedIn,(req,res) => {
    const user = req.user;
    res.render('employee', { currentPage : 'employee', user});
})

app.get('/employee',isLoggedIn, async (req, res) => {
    try {
        const user = req.user;
        const employees = await Employee.find(); // Fetch all employees from the database
        res.render('employeeList', { currentPage : 'employee', employees, user }); // Pass data to the EJS template
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving employees');
    }
});


app.post('/createemployee', upload.single('image'), async (req, res) => {
    try {
        console.log('File uploaded:', req.file); // Debug log
        console.log('Request body:', req.body);

        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        const { name, email, mobile, designation, gender, course } = req.body;

        const employee = new Employee({
            name,
            email,
            mobile,
            designation,
            gender,
            courses: Array.isArray(course) ? course : [course], 
            image: `/uploads/${req.file.filename}`, 
        });

        await employee.save();
        res.redirect('/employee');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating employee');
    }
});


app.get('/employee/edit/:id', isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        const   user  =req.user;
        const employee = await Employee.findById(id);

        if (!employee) {
            return res.status(404).send('Employee not found');
        }

        res.render('editEmployee', { employee, currentPage: 'employee' , user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching employee data for editing');
    }
});

app.get('/employee/delete/:id', isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Employee.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).send('Employee not found');
        }

        res.redirect('/employee');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting employee');
    }
});


app.post('/employee/edit/:id', isLoggedIn ,upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
       
        const { name, email, mobile, designation, gender, course } = req.body;

        let updatedData = {
            name,
            email,
            mobile,
            designation,
            gender,
            courses: Array.isArray(course) ? course : [course]
        };

        if (req.file) {
            updatedData.image = req.file.filename; // Update image if a new file is uploaded
        }

        const employee = await Employee.findByIdAndUpdate(id, updatedData, { new: true });

        if (!employee) {
            return res.status(404).send('Employee not found');
        }
        
        res.redirect('/employee');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating employee details');
    }
});



app.get("/logout" , (req,res) => {
    res.clearCookie("token");
    res.redirect("/login");

})



app.listen(4000, () => {
    console.log("Server is running on port 4000");
})
