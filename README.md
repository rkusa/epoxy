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

```html
    <input type="checkbox" checked="{{ todo.isDone }}" />
    <input type="text" value="{{ todo.task }}" />
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

## MIT License

Copyright (c) 2014 Markus Ast

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[npm]: http://img.shields.io/npm/v/epoxy.svg?style=flat-square
[drone]: https://ci.rkusa.st/github.com/rkusa/epoxy/status.svg