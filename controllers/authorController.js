const { body,validationResult } = require('express-validator');
const async = require('async');
const Book = require('../models/book');
const Author = require('../models/author');
let debug=require('debug')('author');

exports.author_list = (req, res,next )=> {
    Author.find()
        .sort([['family_name', 'ascending']])
        .exec(function (err, list_authors) {
    
    if (err) { return next(err); }
      res.render('author_list', 
            {title: 'Author List', 
             author_list: list_authors});
    });
};

exports.author_detail = (req, res,next)=> {
    async.parallel({
        author: (callback)=>{
            Author.findById(req.params.id)
              .exec(callback)
        },
        authors_books: (callback)=> {
          Book.find({ 'author': req.params.id },'title summary')
          .exec(callback)
        },
    }, function(err, results) {
        if (err) return next(err);  
        if (results.author==null) {
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.authors_books } );
    });
};

exports.author_create_get = function(req, res, next) {
    res.render('author_form', { title: 'Create Author'});
};


exports.author_create_post =[
    body('first_name').trim().isLength({min:1}).escape().withMessage('First name must be specified')
        .isAlphanumeric().withMessage('First name must be non-alphanumeric characters'),
    body('family_name').trim().isLength({min:1}).escape().withMessage('too short Second name')
        .isAlphanumeric().withMessage('must be non-alphanumeric family name'),
    body('date_of_birth', 'Invalid date of birth').optional({checkFalsy:true}).isISO8601().toDate(),
    body('date_of_death','Invalid date of death').optional({checkFalsy:true}).isISO8601().toDate(),        
    
    function(req, res, next) {
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        res.render('author_form',{title:'Create author',Author:req.body,errors:errors.array()});
        return;
    }
    else{
        let author=new Author({
            first_name:req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth:req.body.date_of_birth,
            date_of_death: req.body.date_of_death
        });
        author.save((err)=>{
            if(err) return next(err);
            res.redirect(author.url);
        });
    }
}
];

exports.author_delete_get = function(req, res, next) {
    async.parallel({
        author:(callback)=>{
            Author.findById(req.params.id)
                .exec(callback);
        },
        authors_books:(callback)=>{
            Book.find({'author':req.params.id})
                .exec(callback);
        },
    },
    (err,results)=>{
        if(err){ return next(err);}
        if(results.author==null){
            res.redirect('/catalog/authors');
        }
        res.render('author_delete',{title:'Delete author', author: results.author, author_books:results.authors_books});
    });
};


exports.author_delete_post = (req, res,next)=> {
    async.parallel({
        author: (callback)=>{
            Author.findById(req.body.authorid)
                .exec(callback);
        },
        authors_books:(callback)=>{
            Book.find({author:req.body.authorid})
                .exec(callback);
        },
    }, (err,results)=>{
            if(err) return next(err);
            if(results.authors_books.length>0){
                res.render('author_delete',{title: 'Delete author', author: results.author, author_books: results.authors_books});
                return;
            }
            else
            {
                Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err){
                    if(err) return next(err);
                    res.redirect('/catalog/authors');
                });
            }
    });    
};


exports.author_update_get = (req, res, next)=> {
    //req.sanitize('id').escape().trim();
    Author.findById(req.params.id, function (err, author) {
        if (err) { 
            debug('update error:'+err);
            return next(err); }
        if (author == null) { 
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }

        res.render('author_form', { title: 'Update Author', author: author });
    });
};


exports.author_update_post =[
    body('first_name').trim().isLength({min:1}).escape().withMessage('First name must be specified')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters'),
    body('family_name').trim().isLength({min:1}).escape().withMessage('Family name must be specified')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters'),
    body('date_of_birth', 'Invalid date of birth').optional({checkFalsy: true}).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({checkFalsy: true}).isISO8601().toDate(),    

    (req,res,next)=>{
        const errors=validationResult(req);
        let author=new Author(
            {
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death:req.body.date_of_death,
                _id: req.params.id

            }
        );
        if(!errors.isEmpty()){
            res.render('author_form',{title: 'Update author',author:author,errors:errors.array()});
            return;
        }
        else{
            Author.findByIdAndUpdate(req.params.id,author,{},(err,theauthor)=>{
                if(err){return next(err);}
                res.redirect(theauthor.url);
            });
        }
    }
];