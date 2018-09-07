# -*- coding: utf-8 -*-
#
# Configuration file for the Sphinx documentation builder.
#
# This file does only contain a selection of the most common options. For a
# full list see the documentation:
# http://www.sphinx-doc.org/en/master/config

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.
#
# import os
# import sys
# sys.path.insert(0, os.path.abspath('.'))
# import sphinx_rtd_theme

# -- Project information -----------------------------------------------------

project = 'ReNomIMG'
copyright = '2018, Grid'
author = 'Grid'

# The short X.Y version
version = ''
# The full version, including alpha/beta/rc tags
release = ''


# -- General configuration ---------------------------------------------------

# If your documentation needs a minimal Sphinx version, state it here.
#
# needs_sphinx = '1.0'

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.mathjax',
    'sphinx.ext.napoleon'
]

# Autodoc settings.
autoclass_content = 'both'
add_module_names = False
undoc_members = True

# Add any paths that contain templates here, relative to this directory.
templates_path = ['_templates']

# The suffix(es) of source filenames.
# You can specify multiple suffix as a list of string:
#
# source_suffix = ['.rst', '.md']
source_suffix = '.rst'

# The master toctree document.
master_doc = 'index'

# The language for content autogenerated by Sphinx. Refer to documentation
# for a list of supported languages.
#
# This is also used if you do content translation via gettext catalogs.
# Usually you set "language" from the command line for these cases.
language = "en"

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This pattern also affects html_static_path and html_extra_path .
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

# The name of the Pygments (syntax highlighting) style to use.
pygments_style = 'sphinx'


# -- Options for HTML output -------------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
#
html_theme = "sphinx_rtd_theme"
html_theme_path = ["_themes/sphinx_rtd_theme-master"]

# Theme options are theme-specific and customize the look and feel of a theme
# further.  For a list of options available for each theme, see the
# documentation.
#
# html_theme_options = {}

# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the builtin "default.css".
html_static_path = ['_static']

# Document settings.
import re
import inspect
from renom_img.api import Base
from renom.layers.function.parameterized import Model

global processing_class
processing_class = None


def skip_doc(app, what, name, obj, skip, options):
    model_method = list(Model.__dict__.values())
    # TODO: Modify this condition.
    if obj in model_method or (name not in str(options["members"]) and what == "module") \
            and name != "Detector":
        return True
    return None


def process_doc(app, what, name, obj, options, lines):
    global processing_class
    if what == "method":
        class_name = re.search(r".+\.", str(obj).split(" ")[1])
        if class_name is None:
            return
        class_name = class_name.group()

        if class_name:
            class_name = class_name[:-1]
            if not hasattr(processing_class, "mro"):
                return
            if class_name in [c.__name__ for c in processing_class.mro()] and len(lines):
                for l in range(len(lines)):
                    lines[l] = re.sub(r"\$\{class\}", processing_class.__name__, lines[l])
    else:
        processing_class = obj


def setup(app):
    app.connect("autodoc-skip-member", skip_doc)
    app.connect("autodoc-process-docstring", process_doc)

# Custom sidebar templates, must be a dictionary that maps document names
# to template names.
#
# The default sidebars (for documents that don't match any pattern) are
# defined by theme itself.  Builtin themes are using these templates by
# default: ``['localtoc.html', 'relations.html', 'sourcelink.html',
# 'searchbox.html']``.
#
# html_sidebars = {}


# -- Options for HTMLHelp output ---------------------------------------------

# Output file base name for HTML help builder.
htmlhelp_basename = 'ReNomIMGdoc'


# -- Options for LaTeX output ------------------------------------------------

latex_elements = {
    # The paper size ('letterpaper' or 'a4paper').
    #
    # 'papersize': 'letterpaper',

    # The font size ('10pt', '11pt' or '12pt').
    #
    # 'pointsize': '10pt',

    # Additional stuff for the LaTeX preamble.
    #
    # 'preamble': '',

    # Latex figure (float) alignment
    #
    # 'figure_align': 'htbp',
}

# Grouping the document tree into LaTeX files. List of tuples
# (source start file, target name, title,
#  author, documentclass [howto, manual, or own class]).
latex_documents = [
    (master_doc, 'ReNomIMG.tex', 'ReNomIMG Documentation',
     'Grid', 'manual'),
]


# -- Options for manual page output ------------------------------------------

# One entry per manual page. List of tuples
# (source start file, name, description, authors, manual section).
man_pages = [
    (master_doc, 'renomimg', 'ReNomIMG Documentation',
     [author], 1)
]


# -- Options for Texinfo output ----------------------------------------------

# Grouping the document tree into Texinfo files. List of tuples
# (source start file, target name, title, author,
#  dir menu entry, description, category)
texinfo_documents = [
    (master_doc, 'ReNomIMG', 'ReNomIMG Documentation',
     author, 'ReNomIMG', 'One line description of project.',
     'Miscellaneous'),
]


# -- Extension configuration -------------------------------------------------
locale_dirs = ['_locale/']
gettext_compact = False
