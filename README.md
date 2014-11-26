# epoxy

Declarative template data binding.

[![NPM][npm]](https://npmjs.org/package/epoxy)
[![Build Status][drone]](https://ci.rkusa.st/github.com/rkusa/epoxy)

`epoxy` uses the following emerging Web standards:

- MutationObserver
- WeakMap
- Object.observe

## Usage

```js
    epoxy.bind(target, data)
```

## Syntax

#### Variables

Can be used inside text:
```html
    <input type="text" value="{{ todo.task }}" />
    Your task: {{ todo.task }}
```

#### Repeat

```html
    <ul>
      <template repeat="{{ todos }}">
        <li>{{ task }}</li>
      </template>
    </ul>
```

#### If

```html
  <template if="{{ todos.length }}">
    You have {{ todos.length }} todos left.
  </template>
```

You can also combine `if` and `repeat`.

#### Unless

```html
  <template unless="{{ todos.length }}">
    Well done, you have no todos left!
  </template>
```

You can also combine `unless` and `repeat`.

## Inputs

```html
    <input type="checkbox" checked="{{ todo.isDone }}" />

    <select value="{{ isDone }}">
      <option value="true">true</option>
      <option value="false">false</option>
    </select>

    <input type="radio" name="isDone" value="true" checked="{{ isDone }}" /> True
    <input type="radio" name="isDone" value="false" checked="{{ isDone }}" /> False

    <input type="text" value="{{ todo.task }}" />

    <textarea>{{ todo.task }}</textarea>
```

## Filters

`{{ expression | filterName }}`

## `html`

Do not encode html entities.

## `class`

```html
  <span class="{{ item.selected | class('active') }}"></span>
```

### Create Custom Filter

```js
// getter only
epoxy.registerFilter('uppercase', function(value) {
  return value.length
})

// getter and setter
epoxy.registerFilter('uppercase', {
  get: function(value) {
    return value
  },
  set: function(value) {
    return value.toUpperCase()
  }
})
```

## MIT License

Copyright (c) 2014 Markus Ast

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[npm]: http://img.shields.io/npm/v/epoxy.svg?style=flat-square
[drone]: http://ci.rkusa.st/api/badge/github.com/rkusa/epoxy/status.svg?branch=master&style=flat-square