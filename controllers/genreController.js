const { body,validationResult } = require('express-validator');
let Book=require('../models/book');
let async=require('async');
let Genre = require('../models/genre');


exports.genre_list = function(req, res) {
    Genre.find()
        .sort([['name','ascending']])
        .exec((err,list_genres)=>{
            if(err) return next(err);
            res.render('genre_list',{title:'Genre list',genre_list:list_genres});
        });
};

exports.genre_detail = (req, res, next)=> {
   async.parallel({
        genre: (callback)=>{
            Genre.findById(req.params.id)
            .exec(callback);
        },

        genre_books: (callback)=>{
            Book.find({'genre':req.params.id})
            .exec(callback);
        },
   }, (err,results)=>{
    if(err){return next(err);}
    if(results.genre==null){
        let err=new Error('Genre not found');
        err.status=404;
        return next(err);
    }
    res.render('genre_detail',{title:'Genre Detail', genre: results.genre, genre_books: results.genre_books});
   
    });
};

exports.genre_create_get = (req, res, next)=> {
    res.render('genre_form',{title:'Create genre'});
};

exports.genre_create_post = [
    body('name', 'Genre name required').trim().isLength({min:1}).escape(),
    (req, res, next)=> {
        const errors=validationResult(req);
        let genre=new Genre(
        {name:req.body.name}
        );
        if (!errors.isEmpty())
        {
            res.render('genre_form',{title:'Create genre',genre:genre, errors:errors.array()});
            return;
        }
        else
        {
            Genre.findOne({'name':req.params.name})
                .exec((err,found_genre)=>{
                    if(err){return next(err);}

                    if(found_genre){
                        res.redirect(found_genre.url);
                    }
                    else
                    {
                            genre.save((err)=>{
                                if(err){return next(err);}
                                res.redirect(genre.url);
                            });
                    }
                });
        }
}];

exports.genre_delete_get = (req, res,next)=> {
    async.parallel({
        genre:(callback)=>{
            Genre.findById(req.params.id)
                .exec(callback);
        },
        books:(callback)=>{
            Book.find({'genre':req.params.id})
                .exec(callback);
        }
    },
    (err,results)=>{
        if(err) return next(err);
        if(results.genre==null)
        {
            res.redirect('/catalog/genres');
        }
        res.render('genre_delete',{title: 'Delete genre', books:results.books, genre:results.genre});
    });
};

exports.genre_delete_post = (req, res,next)=> {
    async.parallel({
        genre:(callback)=>{
            Genre.findById(req.body.genreid)
                .exec(callback);
        },
        books:(callback)=>{
            Book.find({'genre':req.body.genreid})
                .exec(callback);
        }
    },
    (err,results)=>{
        if(err)return next(err);
        if(results.books>0){
            res.render('genre_delete',{title:'Delete book',books:results.books,genre:results.genre});
            return;
        }
        else{
            Genre.findByIdAndRemove(req.body.genreid, function genreDelete(err){
                if(err)return next(err);
                res.redirect('/catalog/genres');
            });
        }
    });
};

exports.genre_update_get = (req, res, next)=> {
               Genre.findById(req.params.id,(err,genre)=>{
                   if(err) return next(err);
                   if(genre==null){
                       let err=new Error('Genre not found');
                       err.status=404;
                       return next(err);
                   }
                   res.render('genre_form',{title:'Update genre', genre:genre });
               });
    
};

exports.genre_update_post = [
  body('name','name must be specified').trim().isLength({min:1}).escape(),
  (req,res,next)=>{
      const errors=new validationResult(req);

      let genre=new Genre({
          name: req.body.name,
          _id:req.params.id
      });
      if(!errors.isEmpty()){
          res.render('genre_form',{title:'Update genre', genre:genre,errors:errors.array()});
          return;
      }
      else{
          Genre.findByIdAndUpdate(req.params.id,genre,{},(err,thegenre)=>{
              if(err)return next(err);
              res.redirect(thegenre.url);
          });
      }
  }  
];