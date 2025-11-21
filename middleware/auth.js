const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware - verify JWT token
const auth = async (req, res, next) => {
  try {
    // Ambil token dari header Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('🔐 Auth Middleware:', {
      path: req.path,
      method: req.method,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN'
    });
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified:', { userId: decoded.userId, role: decoded.role });
    
    // Cari user berdasarkan ID dari token
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('❌ User not found for token');
      return res.status(401).json({
        success: false,
        message: 'Token is not valid. User not found.'
      });
    }

    console.log('✅ User authenticated:', { id: user._id, email: user.email, role: user.role });
    
    // Tambahkan user ke request object
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Admin authorization middleware
const adminAuth = async (req, res, next) => {
  console.log('👑 Admin Auth Middleware:', { 
    hasUser: !!req.user, 
    userRole: req.user?.role 
  });
  
  if (!req.user) {
    console.log('❌ No user in request');
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (req.user.role !== 'admin') {
    console.log('❌ User is not admin:', req.user.role);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  console.log('✅ Admin access granted');
  next();
};

// Optional auth - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user) {
        req.user = user;
        req.token = token;
      }
    }
  } catch (error) {
    // Silent fail for optional auth
    console.log('Optional auth failed:', error.message);
  }
  
  next();
};

module.exports = { auth, adminAuth, optionalAuth };
