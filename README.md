# Math Lessons

Interactive math lessons for students, published free with GitHub Pages.

## What's in this folder

```
index.html                      Home page: the list of lessons
lessons/10-adding-vectors.html  One page per lesson
widgets/vector-addition.js      The interactive examples (one file per kind of example)
css/site.css                    Shared look for every page
```

## Turn the site on (one time)

1. Upload everything in this folder to the `math-widgets` repository, keeping the
   folders as they are (drag the whole folder contents onto GitHub's upload page).
2. In the repository, open **Settings → Pages**.
3. Under "Build and deployment", choose **Deploy from a branch**, pick `main` and `/ (root)`, and click **Save**.
4. After a minute or two the site is live at
   `https://YOUR-GITHUB-USERNAME.github.io/math-widgets/`. Give that link to students.

## Add a new lesson

1. Copy `lessons/10-adding-vectors.html` and rename it, e.g. `lessons/11-subtracting-integers.html`.
2. Replace the title and paragraphs with the new lesson's text.
3. Add a line for it in the list on `index.html` (copy the existing `<li>` block).

## Put an interactive example in a lesson

Anywhere in a lesson, add:

```html
<figure class="interactive">
  <div data-widget="vector-addition" data-a="3" data-b="-2"></div>
</figure>
```

and make sure the bottom of the page has:

```html
<script src="../widgets/vector-addition.js"></script>
```

Change `data-a` and `data-b` to set the starting example. Add `data-negatives="no"`
to keep "New example" to positive numbers only.

## Writing negative numbers

The lessons use a raised negative sign: `<sup class="neg">−</sup>2` shows as a raised minus before the 2.
