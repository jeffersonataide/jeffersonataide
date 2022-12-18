---
layout: "../../layouts/Blog.astro"
title: Django Auth
tags: posts
date: 2021-08-26
---

## INTRODUCTION

When creating a REST API for client applications to communicate with, it is common to want it to have some authentication and permissions. In this post I would like to walk through the set up of the API for a Books collection application. The API allows users to be created, to get access token and to use it on future requests. This way unauthenticated users can see the list of books, but only authenticated users can create, edit or delete books.

For this we'll be using the [Django Framework](https://www.djangoproject.com/), with the [Django REST Framework](https://www.django-rest-framework.org/). If you still don't know them go ahead and check their website, they have great tutorials to get you started.

For making requests to test it, I find [Insomnia](https://insomnia.rest/) really good, and hey they have a free tier 😎. Another client that I find really useful is the command line app [HTTPie](https://httpie.io/). I'll be using HTTPie for this tutorial, it makes it easier for you to try the commands on your own, and for diplaying the results in text instead of screenshots.

Finally I saved the result on [Github](https://github.com/jefferson2z/django-token-auth-tutorial), in case you get lost or just want to check the final result.

Withour further ado let's get to it.

## CREATING THE PROJECT

For this project I will be using pipenv for package management, because it automatically creates and manages the virtual environment. In case you don't have it installed yet, it's quite easy to do it, you can follow the instructions from their [documentation](https://pipenv.pypa.io/en/latest/#install-pipenv-today). You can also use [venv](https://docs.python.org/3/tutorial/venv.html), [poetry](https://python-poetry.org/), or any other tool you prefer.

Let's start by installing Django, and Django REST framework. Inside the folder you would like to create the project, run the command:

```
# Install the packages, and creates a virtual environment
pipenv install django djangorestframework

# Activates the virtual environment
pipenv shell
```

Now we can create the project for our API.

```
django-admin startproject api .
```

I add the `.` character at the end to start the project in the current folder. This way I have the `manage.py` file in the same folder as `Pipfile`, and just one folder. So our folder structure should look like this

```
.
├── api
│   ├── asgi.py
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── manage.py
├── Pipfile
└── Pipfile.lock
```

If instead we hadn't used the `.`, we would have the following structure.

```
.
├── api
│   ├── api
│   │   ├── asgi.py
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── manage.py
├── Pipfile
└── Pipfile.lock
```

To tell our project that we are using the REST framework. Add it to `INTALLED_APPS` on `api/settings.py`.

```
INSTALLED_APPS = [
    'rest_framework',
    ...
]
```

Great, now that we have it installed we can create the database.

```
python manage.py migrate
```

This creates the database using the default [SQL Lite](https://www.sqlite.org/index.html), that is fine for this tutorial. In production however we would probably want to use a different database.

## CREATING THE BOOKS APP

Now let's create our books app.

```
python manage.py startapp books
```

To tell our project that we are using the newly created app, add it to `INSTALLED_APPS` on `api/settings.py`

```
INSTALLED_APPS = [
    'books.apps.BooksConfig',
    ...
]
```

We'll create a simple model for books, since this isn't the focus of this tutorial. Edit the `books/models.py` file so it looks like this:

```
from django.db import models


class Book(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True

```

Now we can create the migration and sync the database.

```
# Create migrations for Books app
python manage.py makemigrations books

# Sync the database
python manage.py migrate
```

> Every time we add a new app to `INSTALLED_APPS` or change a model, we can tell Django to create the migrations, with the `makemigrations` command. When we're ready we can sync it with the `migrate` command.

Create the file `books/serializers.py` with the serializer for the Book model.

```
from rest_framework import serializers
from books.models import Book

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ["id", "title", "description"]
```

And a view for creating new books and listing the existing ones. On `books/views.py` add the following.

```
from rest_framework import generics

from books.models import Book
from books.serializers import BookSerializer


class BookList(generics.ListCreateAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
```

And connect the view to our books urls. Create the file `books/urls.py` and connect the view to the root of the route.

```
from django.urls import path
from books.views import BookList

urlpatterns = [
    path("", BookList.as_view(), name="index"),
]

```

And send the routes starting with `books` to the Book app, by adding it to `api/urls.py`:

```
from django.urls import include, path

urlpatterns = [
	...,
    path("books/", include("books.urls")),
]

```

Now we can start the server to test the api.

```
python manage.py runserver
```

After running the system check it should start the development server.

```
Performing system checks...

System check identified no issues (0 silenced).
August 25, 2021 - 22:47:34
Django version 3.2.6, using settings 'api.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.

```

Now if we send a `POST` request to `http://127.0.0.1:8000/books/`, with the book title and description.

```
http http://127.0.0.1:8000/books/ title='Cool book' description='Long description'

```

We'll have created the first book. And it gives the following response:

```
HTTP/1.1 201 Created
...

{
    "description": "Long description",
    "id": 1,
    "title": "Cool book"
}

```

Go ahead and try creating more books.

If we send a `GET` request to `http http://127.0.0.1:8000/books/` we get a list of existing books.

```
http http://127.0.0.1:8000/books/
```

It should display a response similar to the following.

```
HTTP/1.1 200 OK
...

[
    {
        "description": "Long description",
        "id": 1,
        "title": "Cool book"
    },
    {
        "description": "Long description of another book",
        "id": 2,
        "title": "Fantasy book title"
    }
]

```

If we open the route `http://127.0.0.1:8000/books` in our browser we should see the following screen, where it lists all the books saved in our database, and we can use the `POST` method to add more books.

![Books list api response](/blog/django-auth/books-list.png)

Go ahead and try it as well for adding some more books.

As you will notice, we can see all books, and add books without authentication.

Let's now change this behaviour, so that anyone can see the list of books, but only registered users can add new books.

## CREATE USERS

Let's start by creating a separated app for handling our users. On the folder with the `manage.py`file run the command

```
python manage.py startapp users
```

install the users app to `api/settings.py`

```
INSTALLED_APPS = [
    'users.apps.UsersConfig',
        ...
]
```

Now for our user serializer we have something more interesting. Create the file
`users/serializer.py` and add the users serializer:

```
from rest_framework import serializers
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User(email=validated_data["email"], username=validated_data["username"])
        user.set_password(validated_data["password"])
        user.save()
        return user

```

When creating a new user, we use the `set_password` method so that we store the password hash instead of the actual password on the database, for security reasons. We set the password field to write_only, this way we can send a password when creating the user, but when we fetch the users list, it is not returned.

Similar to our books view create the user view on the file `users/views.py`.

```
from django.contrib.auth.models import User
from users.serializers import UserSerializer
from rest_framework import generics


class UserCreate(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
```

and create the urls for users on `users/urls.py`

```
from django.urls import path
from users import views

urlpatterns = [
    path('', views.UserCreate.as_view()),
]
```

Connect the app to `users` routes on `api/urls.py`:

```
urlpatterns = [
    	...,
 	path("users/", include("users.urls")),
]
```

Now we can start the server again and create new users:

```
http http://127.0.0.1:8000/users/ username='Luke' email='luke@cool.com' password='lukespassword'
```

And we should get the following response.

```
HTTP/1.1 201 Created
...

{
    "email": "luke@cool.com",
    "username": "Luke"
}

```

When we send a `GET` request we'll get a list of all users.

```
http http://127.0.0.1:8000/users/

HTTP/1.1 200 OK
...

[
    {
        "email": "luke@cool.com",
        "username": "Luke"
    },
    {
        "email": "leia@cool.com",
        "username": "Leia"
    }
]

```

Notice that we can get the list of users, but the password is not returned.

## USERS TOKEN

Right now we are able to create users, but they have no way to authenticate to our API. For that we will create a route where the user can provide his credentials and get a token which can be used when sending further requests.

To do this, first add the `rest_framework.authtoken` to our installed apps on `api/settings.py`.

```
INSTALLED_APPS = [
    'rest_framework.authtoken',
    	...,
]
```

To create the database tables for the tokens run the command:

```
python manage.py migrate
```

Django REST Framework already provides us with the view `obtain_auth_token` for handling user authentication. All we need is to connect it into a route path. Into `users/urls.py` add the import and plug the view.

```
from rest_framework.authtoken.views import obtain_auth_token


urlpatterns = [
...,
    path('login/', obtain_auth_token)
]


```

Now we can start the server and test it.

```
http http://127.0.0.1:8000/users/login/ username='Luke' password='lukespassword'

HTTP/1.1 200 OK
...

{
    "token": "6650c889f12dafb1cff9dd50b58254f47df67288"
}


```

Go ahead and try sending a wrong combination of username and password to see it denying, as expected.

Now we can send this token in the `Authorization` HTTP header in our future requests in the format bellow, this way the API can provide us with the correct permissions. For instance, for the token above, the header would be:

```
Authorization: Token 6650c889f12dafb1cff9dd50b58254f47df67288
```

Notice the space between the word `Token` and the token itself.

## PROTECT ROUTES WITH TOKEN

The last step is for us to protect our views with the proper permissions. We want to allow any user to see the list of books, but only authenticated users to be able to create new books.

In `books/views.py`, set `permission_classes` to tell it the type of permission we want. Also set `authentication_classes` to the authentication method being used.

```
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticatedOrReadOnly


class BookList(generics.ListCreateAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    authentication_classes = [TokenAuthentication]
```

Now if we try creating a new book with an unauthorized user it denies it.

```
http http://127.0.0.1:8000/books/ title='Sad book' description="I won't work"


HTTP/1.1 401 Unauthorized
...

{
    "detail": "Authentication credentials were not provided."
}
```

If you substitute the `X` bellow with the token returned for your user, it works!

```
http http://127.0.0.1:8000/books/ title='Happy book' description="I work" Authorization:"Token XXXXXXXXXXXXXXXXX"


HTTP/1.1 201 Created
...

{
    "description": "I work",
    "id": 3,
    "title": "Happy book"
}
```

And that's it! 🎉🎉🎉

## CONCLUSION

Having it working I would encourage you to check out the following documentations to learn more about the topic and making it more robust:

[Django User Authentication documentation](https://docs.djangoproject.com/en/3.2/topics/auth/)

[Rest Framework Authentication documentation](https://www.django-rest-framework.org/api-guide/authentication/)

[Rest Framework Permissions documentation](https://www.django-rest-framework.org/api-guide/permissions/)

I hope you enjoyed it and that this content might be useful to someone. It was my first blog post but I tried writing about a subject the I struggled with. I greatly appreciate comments, feedback and suggestions for other topics you would like me to write about.
