describe('expression parser', function() {
  it('should parse identifiers', function() {
    var expr = '{{ foobar }}'
    var ast  = glue.parse(expr)
    expect(ast.body).to.have.lengthOf(1)
    expect(ast.body[0]).to.be.an.instanceOf(glue.ast.Expression)
    expect(ast.body[0].path).to.be.an.instanceOf(glue.ast.Path)
    expect(ast.body[0].path.keys).to.eql(['foobar'])
  })

  it('should parse paths', function() {
    var expr = '{{ foo.bar }}'
    var ast  = glue.parse(expr)
    expect(ast.body).to.have.lengthOf(1)
    expect(ast.body[0].path).to.be.an.instanceOf(glue.ast.Path)
    expect(ast.body[0].path.keys).to.eql(['foo', 'bar'])
  })

  it('should find expression inside text', function() {
    var expr = 'some {{ foo.bar }} content'
    var ast  = glue.parse(expr)
    expect(ast.body).to.have.lengthOf(3)

    expect(ast.body[0]).to.be.an.instanceOf(glue.ast.Text)
    expect(ast.body[0].text).to.equal('some ')

    expect(ast.body[1].path).to.be.an.instanceOf(glue.ast.Path)
    expect(ast.body[1].path.keys).to.eql(['foo', 'bar'])

    expect(ast.body[2]).to.be.an.instanceOf(glue.ast.Text)
    expect(ast.body[2].text).to.equal(' content')
  })
})

var model = {
  isVisible: true,
  tasks: [
    { id: 1, isDone: true, task: 'this' },
    { id: 2, isDone: false, task: 'that' }
  ]
}

describe('template', function() {
  describe('expressions', function() {
    it('should find expression inside a text node',
      compile('text', model))

    it('should find expression inside an attribute node',
      compile('attribute', model.tasks[0]))
  })

  describe('boolean attributes', function() {
    it('should be kept if evaluated to true',
      compile('boolattrtrue', model.tasks[0]))

    it('should be removed if evaluated to false',
      compile('boolattrfalse', model.tasks[1]))
  })

  describe('if helper', function() {
    it('should be rendered if evaluated to true',
      compile('iftrue', model.tasks[0]))

    it('should not be rendered if evaluated to false',
      compile('iffalse', model.tasks[1]))
  })

  describe('repeat helper', function() {
    it('should work', compile('repeat', model))
  })

  describe('repeat and if helper combined', function() {
    it('should be rendered if evaluated to true', function() {
      model.isVisible = true
      compile('repeattrue', model)()
    })

    it('should not be rendered if evaluated to false', function() {
      model.isVisible = false
      compile('repeatfalse', model)()
    })
  })


})

function compile(name, model) {
  return function() {
    var template    = document.querySelector('#' + name + '-template')
    var expectation = document.querySelector('#' + name + '-expectation')

    var clone = document.importNode(template.content, true)
    glue.bind(clone, model)

    var div = document.createElement('div')
    div.appendChild(clone)

    expectation = expectation.innerHTML.replace(/\n\s*/g, '')
    var result = div.innerHTML.replace(/\n\s*/g, '')

    expect(result).to.equal(expectation)
  }
}