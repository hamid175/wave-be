const prisma = require("../configs/databaseConfig");
const bcrypt = require("bcrypt");
const Jwt = require("jsonwebtoken");

const {
  validateAdminSignUp,
  validateAdminUpdate,
  validateForgetPassword,
  validateUpdatePassword,
  validateLogin,
} = require("../validations/admin");
require("dotenv").config();

exports.signUp = async (req, res) => {
  try {
    const { error, value } = validateAdminSignUp(req.body);
    if (error) {
      return res
        .status(400)
        .json({ message: `Validation error: ${error.details[0].message}` });
    }

    const admin = await prisma.admin.findUnique({
      where: {
        email: value.email,
      },
    });
    if (admin) {
      return res.status(400).json({ message: "Email Already Exist" });
    }
    const saltRound = process.env.saltRounds;
    const hashPassword = await bcrypt.hash(value.password, parseInt(saltRound));

    const newAdmin = await prisma.admin.create({
      data: {
        email: value.email,
        password: hashPassword,
        firstName: value.firstName,
        lastName: value.lastName,
        dateOfBirth: value.dateOfBirth,
        address: value.address,
        city: value.city,
        country: value.country,
        postalCode: value.postalCode,
        phoneNumber: value.phoneNumber,
        profile_image: value?.profile_image || null,
      },
    });
    delete newAdmin.password;

    return res
      .status(201)
      .json({ message: "Admin successfully created", newAdmin });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}; // Done with it

exports.getTokenData = async (req, res) => {
  const adminId = req.admin.id;

  const admin = await prisma.admin.findUnique({
    where: {
      id: adminId,
    },
  });
  delete admin.password;
  res.json({ Admin: admin });
}; // Done with it

exports.logIn = async (req, res) => {
  const { error, value } = validateLogin(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: `Validation error: ${error.details[0].message}` });
  }

  const admin = await prisma.admin.findUnique({
    where: {
      email: req.body.email,
    },
  });

  if (admin) {
    const isPasswordMatch = await bcrypt.compare(
      req.body.password,
      admin.password
    );

    if (isPasswordMatch) {
      const jwtToken = Jwt.sign(
        {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          dateOfBirth: admin.dateOfBirth,
          address: admin.address,
          city: admin.city,
          country: admin.country,
          postalCode: admin.postalCode,
          phoneNumber: admin.phoneNumber,
        },
        process.env.SECRETKEY,
        {
          expiresIn: process.env.JWT_Expiry,
        }
      );

      delete admin.password;
      res
        .status(200)
        .json({ message: "login successful", admin, token: jwtToken });
    } else {
      res.status(401).json({ message: "Invalid password" });
    }
  } else {
    res.status(404).json({ message: "Admin Not found" });
  }
};

exports.getAllAdmin = async (req, res) => {
  try {
    const getAdmin = await prisma.admin.findMany();

    const hidePassword = getAdmin.map((admin) => {
      const { password, ...hidePassword } = admin;
      return hidePassword;
    });

    res
      .status(200)
      .json({ message: "Successfully Fetched admin", admin: hidePassword });
  } catch (error) {
    console.error(error);
  }
}; // Done with it

exports.getOne = async (req, res) => {
  try {
    const isId = await prisma.admin.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!isId) {
      return res.status(400).json({ message: "Admin not found" });
    }
    delete isId.password;
    res
      .status(200)
      .json({ message: "Successfully Displayed data of admin", admin: isId });
  } catch (error) {
    if (error.code === "P2023") {
      return res.status(404).json({ message: "Invalid Id format" });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}; /// Done with it

exports.deleteAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;

    const existingId = await prisma.admin.findUnique({
      where: {
        id: adminId,
      },
    });

    if (!existingId) {
      return res.status(400).json({ message: "Admin not found" });
    }

    const messages = await prisma.message.findMany({
      where: {
        id: adminId,
      },
    });

    await prisma.message.deleteMany({
      where: {
        id: adminId,
      },
    });

    await prisma.admin.delete({
      where: {
        id: adminId,
      },
    });

    return res.status(200).json({ message: "Admin deleted Successfully" });
  } catch (error) {
    if (error.code === "P2023") {
      return res.status(404).json({ message: "Invalid Id format" });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}; // Done with it

exports.updateAdmin = async (req, res) => {
  try {
    const { error, value } = validateAdminUpdate(req.body);

    if (error) {
      return res
        .status(400)
        .json({ message: `Validation error: ${error.details[0].message}` });
    }

    const existingAdmin = await prisma.admin.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existingAdmin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    if (value.email !== undefined && value.email !== existingAdmin.email) {
      const adminWithEmail = await prisma.admin.findUnique({
        where: {
          email: value.email,
        },
      });

      if (adminWithEmail) {
        return res.status(400).json({ message: "Email Already Registered" });
      }
    } else {
      email = existingAdmin.email;
    }

    const updateData = await prisma.admin.update({
      where: {
        id: req.params.id,
      },
      data: {
        firstName: value?.firstName,
        lastName: value?.lastName,
        email: value?.email,
        dateOfBirth: value?.dateOfBirth,
        address: value?.address,
        city: value?.city,
        country: value?.country,
        postalCode: value?.postalCode,
        phoneNumber: value?.phoneNumber,
        profile_image: value?.profile_image,
      },
    });
    // delete updateData.password;
    return res.status(201).json({
      message: "Admin updated Successfully",
      data: updateData,
    });
  } catch (error) {
    if (error.code === "P2023") {
      return res.status(400).json({ message: "Invalid admin ID format" });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}; /// Done with it

exports.forgetPassword = async (req, res) => {
  try {
    const { error, value } = validateForgetPassword(req.body);

    if (error) {
      return res
        .status(400)
        .json({ message: `Validation error: ${error.details[0].message}` });
    }

    const { newPassword, confirmNewPassword, otp } = value;

    const existingAdmin = await prisma.admin.findUnique({
      where: {
        id: req.params.id,
      },
    });
    if (!existingAdmin) {
      return res.status(400).json({ message: "Admin Not Exists  ." });
    }

    if (newPassword === confirmNewPassword) {
      console.log("Password are same");
      const saltRound = process.env.saltRounds;
      var hashPassword = await bcrypt.hash(newPassword, parseInt(saltRound));

      console.log(hashPassword);
    } else {
      return res.status(400).json({ message: "Passwords must be the same" });
    }

    const isOtp = await prisma.otp.findFirst({
      where: {
        receiver_id: req.params.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!isOtp) {
      return res
        .status(404)
        .json({ message: "No OTP registered for this admin" });
    }

    // Check if OTP matches the provided OTP
    if (isOtp.otp !== otp) {
      return res.status(404).json({ message: "OTP does not match" });
    }

    const expiryTimeMinutes = 1;
    const expiryTimeMilliseconds = expiryTimeMinutes * 60000;
    const createdAt = new Date(isOtp.createdAt);
    const isLimit = new Date(createdAt.getTime() + expiryTimeMilliseconds);
    const currentTime = new Date();

    if (currentTime < isLimit) {
      if (isOtp.status === "Expired") {
        return res.status(404).json({ message: "Can't use Expired OTP" });
      }
      await prisma.otp.deleteMany({
        where: {
          receiver_id: isOtp.receiver_id,
        },
      });
    } else {
      await prisma.otp.update({
        where: {
          id: isOtp.id,
        },
        data: {
          status: "Expired",
        },
      });
      return res.status(400).json({ message: "Time has expired" });
    }

    const passwordUpdate = await prisma.admin.update({
      where: {
        id: req.params.id,
      },
      data: {
        password: hashPassword,
      },
    });

    delete passwordUpdate.password;
    return res.status(201).json({
      message: "Password updated Successfully",
      data: passwordUpdate,
    });
  } catch (error) {
    if (error.code === "P2023") {
      return res.status(400).json({ message: "Invalid admin ID format" });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}; /// Done with it

exports.updatePassword = async (req, res) => {
  try {
    const { error, value } = validateUpdatePassword(req.body);

    if (error) {
      return res
        .status(400)
        .json({ message: `Validation error: ${error.details[0].message}` });
    }

    const { oldpassword, newpassword, confirmPassword, otp } = value;

    const existingAdmin = await prisma.admin.findUnique({
      where: {
        id: req.params.id,
      },
    });
    if (!existingAdmin) {
      return res.status(400).json({ message: "Admin Not Exists  " });
    }

    const isPassword = await bcrypt.compare(
      oldpassword,
      existingAdmin.password
    );

    if (!isPassword) {
      return res.status(400).json({ message: "Incorrect old password" });
    }

    console.log(oldpassword);

    console.log(newpassword);

    if (oldpassword === newpassword) {
      return res
        .status(400)
        .json({ message: "New Password must not be same as old Password" });
    }

    if (confirmPassword !== newpassword) {
      return res
        .status(400)
        .json({ message: "New and Confirm passwords must be the same " });
    }

    const isOtp = await prisma.otp.findFirst({
      where: {
        receiver_id: req.params.id,
      },
      orderBy: {
        updatedAt: "desc", // Ordering by updatedAt in descending order
      },
    });

    // Check if OTP record exists for the Admin
    if (!isOtp) {
      return res
        .status(404)
        .json({ message: "No OTP registered for this admin" });
    }

    // Check if OTP matches the provided OTP
    if (isOtp.otp !== otp) {
      return res.status(404).json({ message: "OTP does not match" });
    }

    const expiryTimeMinutes = 1;
    const expiryTimeMilliseconds = expiryTimeMinutes * 60000;
    const createdAt = new Date(isOtp.createdAt);
    const isLimit = new Date(createdAt.getTime() + expiryTimeMilliseconds);
    const currentTime = new Date();

    if (currentTime < isLimit) {
      if (isOtp.status === "Expired") {
        return res.status(404).json({ message: "Can't use Expired OTP" });
      }
      await prisma.otp.deleteMany({
        where: {
          receiver_id: isOtp.receiver_id,
        },
      });
    } else {
      await prisma.otp.update({
        where: {
          id: isOtp.id,
        },
        data: {
          status: "Expired",
        },
      });
      return res.status(400).json({ message: "Time has expired" });
    }

    const newPass = await bcrypt.hash(
      newpassword,
      parseInt(process.env.saltRounds)
    );

    const updatedPassword = await prisma.admin.update({
      where: {
        id: req.params.id,
      },
      data: {
        password: newPass,
      },
    });

    delete updatedPassword.password;

    return res
      .status(201)
      .json({ message: "Password updated successfully.", updatedPassword });
  } catch (error) {
    if (error.code === "P2023") {
      return res.status(400).json({ message: "Invalid admin ID format" });
    }

    console.error(error);
  }
};
