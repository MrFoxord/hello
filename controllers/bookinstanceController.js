const { body,validationResult } = require('express-validator');
let BookInstance = require('../models/bookinstance');
let Book=require('../models/book');
let async=require('async');


exports.bookinstance_list = function(req, res, next ) {
    BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
      if (err) { return next(err); }
      res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
    });
};

exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) {
          var err = new Error('Book copy not found');
          err.status = 404;
          return next(err);
        }
      res.render('bookinstance_detail', { title: 'Copy: '+bookinstance.book.title, bookinstance:  bookinstance});
    })
};

exports.bookinstance_create_get = function(req, res, next) {
    Book.find({},'title')
        .exec((err,books)=>{
            if(err) return next(err);

            res.render('bookinstance_form',{title:'Create bookInstance', book_list: books});
        });
};

exports.bookinstance_create_post = [
    body('book','Book must be specified').trim().isLength({min:1}).escape(),
    body('imprint','Imprint must be specified').trim().isLength({min:1}).escape(),
    body('status').escape(),
    body('due_back','Invalid date').optional({checkFalsy:true}).isISO8601().toDate(),
    (req,res,next)=>{
        const errors=validationResult(req);

        let bookinstance= new BookInstance(
            {
                book:req.body.book,
                imprint:req.body.imprint,
                status:req.body.status,
                due_back:req.body.due_back
            });
        if(!errors.isEmpty()){
            Book.find({},'title')
                .exec((err,books)=>{
                    if(err)return next(err);
                    res.render('bookinstance_form',{title:'Create book instance', book_list:books, selected_book:book._id, errors:errors.array(), bookinstance:bookinstance});
                });
            return;
        }
        else
        {
            bookinstance.save((err)=>{
                if(err)return next(err);
                res.redirect(bookinstance.url);
            });
        }
    }
];

exports.bookinstance_delete_get = function(req, res, next) {
    async.parallel({
        bookinstance: (callback)=>{
            BookInstance.findById(req.params.id)
                .populate('book')
                .exec(callback);
        },
        book_bookinstance:(callback)=>{
            Book.findById(req.params.id)
                .exec(callback);
        }
    },(err,results)=>{
        if(err) 
            {return next(err);}
        if(results.bookinstance==null)
            {res.redirect('/catalog/bookinstances');}
        else    
        {res.render('bookinstance_delete', {title:'Delete Book Instance', 
                                            book: results.bookinstance.book, 
                                            bookinstance: results.bookinstance
                                            }
                    );
        }

    });
};

exports.bookinstance_delete_post = (req, res,next)=> {
    async.parallel({
        bookinstance: (callback)=>{
            BookInstance.findById(req.body.bookinstanceid)
                .exec(callback);
        },
        book_bookinstance: (callback)=>{
            Book.findById(req.body.bookinstanceid)
                .exec(callback);
        },
    },(err,results)=>{
        if(err){return next(err);}
        BookInstance.findByIdAndRemove(req.body.bookinstanceid, 
                                        function deleteInstance(err){
                                            if(err) return next(err);
                                            res.redirect('/catalog/bookinstances')
                                        });
    });
};

exports.bookinstance_update_get = (req, res, next)=> {
    async.parallel({
        b_instance:(callback)=>{
            BookInstance.findById(req.params.id)
                .populate('book')
                .exec(callback);
        },
        book_ins:(callback)=>{
            Book.find(callback)
                
        }
    },
    (err,results)=>{
        if(err) return next(err);
        if(results.b_instance==null){
            let err=new Error('Book instance not found');
            err.status=404;
            return next(err);
        }
        res.render('bookinstance_form',{title: 'Update book instance', book_list:results.book_ins, bookinstance:results.b_instance});
    });
};

exports.bookinstance_update_post =[
    body('book','Book must be specified').trim().isLength({min:1}).escape(),
    body('imprint','Imprint must be specified').trim().isLength({min:1}).escape(),
    body('status').escape(),
    body('due_back','Invalid date').optional({checkFalsy:true}).isISO8601().toDate(),
    (req,res,next)=>{
        const errors=validationResult(req);

        let book_instance= new BookInstance(
            {book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id:req.params.id}
        );
        if(!errors.isEmpty()){
            async.parallel({
                book_ins:(callback)=>{
                    Book.find(callback);
                }
            },
            (err,results)=>{
                if(err)return next(err);
            });
            return;
        }
        else{
            BookInstance.findByIdAndUpdate(req.params.id, book_instance,{},(err,the_instance)=>{
                if(err) return next(err);
                res.redirect(the_instance.url);
            });
        }
    }
];