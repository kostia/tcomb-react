(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/giulio/Documents/Projects/github/tcomb-react/Playground.jsx":[function(require,module,exports){
'use strict';

var React = require('react');
var transform = require('react-tools').transform;
var t = require('tcomb-form');
var toPropTypes = require('.').react.toPropTypes;

var Form = t.form.Form;

function defaultTemplate(locals) {
  return (
    React.createElement("div", {className: "row"}, 
      React.createElement("div", {className: "col-sm-12"}, 
        React.createElement("h1", null, locals.displayName, " playground")
      ), 
      React.createElement("div", {className: "col-sm-6"}, 
        React.createElement("h3", null, "Props"), 
        React.createElement("p", null, React.createElement("b", null, "Hint"), ": Changes will be reflected in the preview"), 
        locals.Form, 
        React.createElement("button", {onClick: locals.onChange}, "Show")
      ), 
      React.createElement("div", {className: "col-sm-6"}, 
        React.createElement("h3", null, "Preview"), 
        React.createElement("div", {ref: locals.previewRef})
      )
    )
  );
}

var PlaygroundProps = t.struct({
  component: t.Func,
  template: t.maybe(t.Func),
  props: t.Type,
  form: t.maybe(t.Obj)
});

var Playground = React.createClass({displayName: "Playground",

  // dogfooding
  propTypes: toPropTypes(PlaygroundProps, {debug: true}),

  onChange: function (value) {
    if (value) {
      React.render(React.createElement(this.props.component, React.__spread({},  value)), this.refs.preview.getDOMNode());
    }
  },

  getValue: function (raw) {
    return this.refs.form.getValue(raw);
  },

  render: function () {

    var locals = {
      displayName: this.props.component.displayName,
      Form: React.createElement(Form, {ref: "form", type: this.props.props, options: this.props.form, onChange: this.onChange}),
      previewRef: 'preview'
    };

    return (this.props.template || defaultTemplate)(locals);
  }

});

// add a custom trasformer for ReactNode to tcomb-form config
// see http://gcanti.github.io/tcomb-form/guide/index.html#transformers
t.form.config.transformers.ReactNode = {

  format: function (element) {
    return t.react.ReactElement.is(element) ? React.renderToStaticMarkup(element) :
      t.Nil.is(element) ? null :
      String(element);
  },

  parse: function (jsx) {
    try {
      return eval(transform(jsx));
    } catch (e) {
      return jsx;
    }
  }

};

module.exports = Playground;
},{".":"/Users/giulio/Documents/Projects/github/tcomb-react/index.js","react":"react","react-tools":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/main.js","tcomb-form":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/index.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/docs/demo/alert/src.js":[function(require,module,exports){
'use strict';

var React = require('react');
var t = require('../../../.');

var AlertType = t.enums.of('info success danger warning');

var AlertProps = t.struct({
  type: AlertType,
  children: t.react.ReactNode
});

var Alert = React.createClass({displayName: "Alert",

  propTypes: t.react.toPropTypes(AlertProps),

  render: function () {
    return (
      React.createElement("div", {
      className: 'alert alert-' + this.props.type}, 
      this.props.children
      )
    );
  }

});

var Playground = require('../../../Playground.jsx');

var formOptions = {
  legend: 'My legend'
};

var playground = React.render(
  React.createElement(Playground, {
    component: Alert, 
    props: AlertProps, 
    form: formOptions}),
  document.getElementById('app')
);

playground.getValue();

},{"../../../.":"/Users/giulio/Documents/Projects/github/tcomb-react/index.js","../../../Playground.jsx":"/Users/giulio/Documents/Projects/github/tcomb-react/Playground.jsx","react":"react"}],"/Users/giulio/Documents/Projects/github/tcomb-react/index.js":[function(require,module,exports){
(function (process){
'use strict';

var React = require('react');
var t = require('tcomb-validation');
var format = t.format;

var ReactElement = t.irreducible('ReactElement', React.isValidElement);
var ReactNode = t.irreducible('ReactNode', function (x) {
  return t.Str.is(x) || t.Num.is(x) || ReactElement.is(x) || t.list(ReactNode).is(x);
});

function toPropTypes(type, opts) {

  var ret = {};

  // envify is great
  if (process.env.NODE_ENV !== 'production') {

    opts = opts || {};
    var isSubtype = (type.meta.kind === 'subtype');
    var props = isSubtype ? type.meta.type.meta.props : type.meta.props;

    Object.keys(props).forEach(function (k) {

      var name = t.getTypeName(props[k]);

      // React custom prop validators
      // see http://facebook.github.io/react/docs/reusable-components.html
      function checkPropType(values, prop, displayName) {
        var value = values[prop];
        if (!t.validate(value, props[prop]).isValid()) {
          var message = format('Invalid prop `%s` = `%s` supplied to `%s`, should be `%s`', prop, value, displayName, name);
          if (opts.debug === true) {
            t.fail(message);
          }
          return new Error(message);
        }
      }

      // add a readable entry in the call stack
      checkPropType.displayName = format('Invalid prop `%s`, should be `%s`', k, name);

      ret[k] = checkPropType;

    });

    // kinda hacky
    if (isSubtype) {
      ret.__all__ = function (values, prop, displayName) {
        if (!type.meta.predicate(values)) {
          var message = format('Invalid props `%j` supplied to `%s`, should be `%s`', values, displayName, t.util.getName(type));
          if (opts.debug === true) {
            t.fail(message);
          }
          return new Error(message);
        }
      };
    }

  }

  return ret;
}

t.react = {
  toPropTypes: toPropTypes,
  ReactElement: ReactElement,
  ReactNode: ReactNode
};

module.exports = t;
}).call(this,require('_process'))
},{"_process":"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/process/browser.js","react":"react","tcomb-validation":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/index.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/main.js":[function(require,module,exports){
'use strict';

var visitors = require('./vendor/fbtransform/visitors');
var transform = require('jstransform').transform;
var typesSyntax = require('jstransform/visitors/type-syntax');
var Buffer = require('buffer').Buffer;

module.exports = {
  transform: function(input, options) {
    var output = innerTransform(input, options);
    var result = output.code;
    if (options && options.sourceMap) {
      var map = inlineSourceMap(
        output.sourceMap,
        input,
        options.sourceFilename
      );
      result += '\n' + map;
    }
    return result;
  },
  transformWithDetails: function(input, options) {
    var output = innerTransform(input, options);
    var result = {};
    result.code = output.code;
    if (options && options.sourceMap) {
      result.sourceMap = output.sourceMap.toJSON();
    }
    return result;
  }
};

function innerTransform(input, options) {
  options = options || {};

  var visitorSets = ['react'];
  if (options.harmony) {
    visitorSets.push('harmony');
  }
  if (options.stripTypes) {
    // Stripping types needs to happen before the other transforms
    // unfortunately, due to bad interactions. For example,
    // es6-rest-param-visitors conflict with stripping rest param type
    // annotation
    input = transform(typesSyntax.visitorList, input, options).code;
  }

  var visitorList = visitors.getVisitorsBySet(visitorSets);
  return transform(visitorList, input, options);
}

function inlineSourceMap(sourceMap, sourceCode, sourceFilename) {
  var json = sourceMap.toJSON();
  json.sources = [sourceFilename];
  json.sourcesContent = [sourceCode];
  var base64 = Buffer(JSON.stringify(json)).toString('base64');
  return '//# sourceMappingURL=data:application/json;base64,' +
         base64;
}

},{"./vendor/fbtransform/visitors":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/vendor/fbtransform/visitors.js","buffer":"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/buffer/index.js","jstransform":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/jstransform.js","jstransform/visitors/type-syntax":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/type-syntax.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/base62/base62.js":[function(require,module,exports){
var Base62 = (function (my) {
  my.chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

  my.encode = function(i){
    if (i === 0) {return '0'}
    var s = ''
    while (i > 0) {
      s = this.chars[i % 62] + s
      i = Math.floor(i/62)
    }
    return s
  };
  my.decode = function(a,b,c,d){
    for (
      b = c = (
        a === (/\W|_|^$/.test(a += "") || a)
      ) - 1;
      d = a.charCodeAt(c++);
    )
    b = b * 62 + d - [, 48, 29, 87][d >> 5];
    return b
  };

  return my;
}({}));

module.exports = Base62
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/esprima-fb/esprima.js":[function(require,module,exports){
/*
  Copyright (C) 2013 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2013 Thaddee Tyl <thaddee.tyl@gmail.com>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*jslint bitwise:true plusplus:true */
/*global esprima:true, define:true, exports:true, window: true,
throwError: true, generateStatement: true, peek: true,
parseAssignmentExpression: true, parseBlock: true,
parseClassExpression: true, parseClassDeclaration: true, parseExpression: true,
parseDeclareClass: true, parseDeclareFunction: true,
parseDeclareModule: true, parseDeclareVariable: true,
parseForStatement: true,
parseFunctionDeclaration: true, parseFunctionExpression: true,
parseFunctionSourceElements: true, parseVariableIdentifier: true,
parseImportSpecifier: true, parseInterface: true,
parseLeftHandSideExpression: true, parseParams: true, validateParam: true,
parseSpreadOrAssignmentExpression: true,
parseStatement: true, parseSourceElement: true, parseConciseBody: true,
advanceXJSChild: true, isXJSIdentifierStart: true, isXJSIdentifierPart: true,
scanXJSStringLiteral: true, scanXJSIdentifier: true,
parseXJSAttributeValue: true, parseXJSChild: true, parseXJSElement: true, parseXJSExpressionContainer: true, parseXJSEmptyExpression: true,
parseFunctionTypeParam: true,
parsePrimaryType: true,
parseTypeAlias: true,
parseType: true, parseTypeAnnotatableIdentifier: true, parseTypeAnnotation: true,
parseYieldExpression: true, parseAwaitExpression: true
*/

(function (root, factory) {
    'use strict';

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // Rhino, and plain browser loading.
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.esprima = {}));
    }
}(this, function (exports) {
    'use strict';

    var Token,
        TokenName,
        FnExprTokens,
        Syntax,
        PropertyKind,
        Messages,
        Regex,
        SyntaxTreeDelegate,
        XHTMLEntities,
        ClassPropertyType,
        source,
        strict,
        index,
        lineNumber,
        lineStart,
        length,
        delegate,
        lookahead,
        state,
        extra;

    Token = {
        BooleanLiteral: 1,
        EOF: 2,
        Identifier: 3,
        Keyword: 4,
        NullLiteral: 5,
        NumericLiteral: 6,
        Punctuator: 7,
        StringLiteral: 8,
        RegularExpression: 9,
        Template: 10,
        XJSIdentifier: 11,
        XJSText: 12
    };

    TokenName = {};
    TokenName[Token.BooleanLiteral] = 'Boolean';
    TokenName[Token.EOF] = '<end>';
    TokenName[Token.Identifier] = 'Identifier';
    TokenName[Token.Keyword] = 'Keyword';
    TokenName[Token.NullLiteral] = 'Null';
    TokenName[Token.NumericLiteral] = 'Numeric';
    TokenName[Token.Punctuator] = 'Punctuator';
    TokenName[Token.StringLiteral] = 'String';
    TokenName[Token.XJSIdentifier] = 'XJSIdentifier';
    TokenName[Token.XJSText] = 'XJSText';
    TokenName[Token.RegularExpression] = 'RegularExpression';

    // A function following one of those tokens is an expression.
    FnExprTokens = ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
                    'return', 'case', 'delete', 'throw', 'void',
                    // assignment operators
                    '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '>>>=',
                    '&=', '|=', '^=', ',',
                    // binary/unary operators
                    '+', '-', '*', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
                    '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=',
                    '<=', '<', '>', '!=', '!=='];

    Syntax = {
        AnyTypeAnnotation: 'AnyTypeAnnotation',
        ArrayExpression: 'ArrayExpression',
        ArrayPattern: 'ArrayPattern',
        ArrayTypeAnnotation: 'ArrayTypeAnnotation',
        ArrowFunctionExpression: 'ArrowFunctionExpression',
        AssignmentExpression: 'AssignmentExpression',
        BinaryExpression: 'BinaryExpression',
        BlockStatement: 'BlockStatement',
        BooleanTypeAnnotation: 'BooleanTypeAnnotation',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ClassBody: 'ClassBody',
        ClassDeclaration: 'ClassDeclaration',
        ClassExpression: 'ClassExpression',
        ClassImplements: 'ClassImplements',
        ClassProperty: 'ClassProperty',
        ComprehensionBlock: 'ComprehensionBlock',
        ComprehensionExpression: 'ComprehensionExpression',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DebuggerStatement: 'DebuggerStatement',
        DeclareClass: 'DeclareClass',
        DeclareFunction: 'DeclareFunction',
        DeclareModule: 'DeclareModule',
        DeclareVariable: 'DeclareVariable',
        DoWhileStatement: 'DoWhileStatement',
        EmptyStatement: 'EmptyStatement',
        ExportDeclaration: 'ExportDeclaration',
        ExportBatchSpecifier: 'ExportBatchSpecifier',
        ExportSpecifier: 'ExportSpecifier',
        ExpressionStatement: 'ExpressionStatement',
        ForInStatement: 'ForInStatement',
        ForOfStatement: 'ForOfStatement',
        ForStatement: 'ForStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        FunctionTypeAnnotation: 'FunctionTypeAnnotation',
        FunctionTypeParam: 'FunctionTypeParam',
        GenericTypeAnnotation: 'GenericTypeAnnotation',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        ImportDeclaration: 'ImportDeclaration',
        ImportDefaultSpecifier: 'ImportDefaultSpecifier',
        ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
        ImportSpecifier: 'ImportSpecifier',
        InterfaceDeclaration: 'InterfaceDeclaration',
        InterfaceExtends: 'InterfaceExtends',
        IntersectionTypeAnnotation: 'IntersectionTypeAnnotation',
        LabeledStatement: 'LabeledStatement',
        Literal: 'Literal',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        MethodDefinition: 'MethodDefinition',
        ModuleSpecifier: 'ModuleSpecifier',
        NewExpression: 'NewExpression',
        NullableTypeAnnotation: 'NullableTypeAnnotation',
        NumberTypeAnnotation: 'NumberTypeAnnotation',
        ObjectExpression: 'ObjectExpression',
        ObjectPattern: 'ObjectPattern',
        ObjectTypeAnnotation: 'ObjectTypeAnnotation',
        ObjectTypeCallProperty: 'ObjectTypeCallProperty',
        ObjectTypeIndexer: 'ObjectTypeIndexer',
        ObjectTypeProperty: 'ObjectTypeProperty',
        Program: 'Program',
        Property: 'Property',
        QualifiedTypeIdentifier: 'QualifiedTypeIdentifier',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SpreadElement: 'SpreadElement',
        SpreadProperty: 'SpreadProperty',
        StringLiteralTypeAnnotation: 'StringLiteralTypeAnnotation',
        StringTypeAnnotation: 'StringTypeAnnotation',
        SwitchCase: 'SwitchCase',
        SwitchStatement: 'SwitchStatement',
        TaggedTemplateExpression: 'TaggedTemplateExpression',
        TemplateElement: 'TemplateElement',
        TemplateLiteral: 'TemplateLiteral',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TupleTypeAnnotation: 'TupleTypeAnnotation',
        TryStatement: 'TryStatement',
        TypeAlias: 'TypeAlias',
        TypeAnnotation: 'TypeAnnotation',
        TypeofTypeAnnotation: 'TypeofTypeAnnotation',
        TypeParameterDeclaration: 'TypeParameterDeclaration',
        TypeParameterInstantiation: 'TypeParameterInstantiation',
        UnaryExpression: 'UnaryExpression',
        UnionTypeAnnotation: 'UnionTypeAnnotation',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        VoidTypeAnnotation: 'VoidTypeAnnotation',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement',
        XJSIdentifier: 'XJSIdentifier',
        XJSNamespacedName: 'XJSNamespacedName',
        XJSMemberExpression: 'XJSMemberExpression',
        XJSEmptyExpression: 'XJSEmptyExpression',
        XJSExpressionContainer: 'XJSExpressionContainer',
        XJSElement: 'XJSElement',
        XJSClosingElement: 'XJSClosingElement',
        XJSOpeningElement: 'XJSOpeningElement',
        XJSAttribute: 'XJSAttribute',
        XJSSpreadAttribute: 'XJSSpreadAttribute',
        XJSText: 'XJSText',
        YieldExpression: 'YieldExpression',
        AwaitExpression: 'AwaitExpression'
    };

    PropertyKind = {
        Data: 1,
        Get: 2,
        Set: 4
    };

    ClassPropertyType = {
        'static': 'static',
        prototype: 'prototype'
    };

    // Error messages should be identical to V8.
    Messages = {
        UnexpectedToken:  'Unexpected token %0',
        UnexpectedNumber:  'Unexpected number',
        UnexpectedString:  'Unexpected string',
        UnexpectedIdentifier:  'Unexpected identifier',
        UnexpectedReserved:  'Unexpected reserved word',
        UnexpectedTemplate:  'Unexpected quasi %0',
        UnexpectedEOS:  'Unexpected end of input',
        NewlineAfterThrow:  'Illegal newline after throw',
        InvalidRegExp: 'Invalid regular expression',
        UnterminatedRegExp:  'Invalid regular expression: missing /',
        InvalidLHSInAssignment:  'Invalid left-hand side in assignment',
        InvalidLHSInFormalsList:  'Invalid left-hand side in formals list',
        InvalidLHSInForIn:  'Invalid left-hand side in for-in',
        MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
        NoCatchOrFinally:  'Missing catch or finally after try',
        UnknownLabel: 'Undefined label \'%0\'',
        Redeclaration: '%0 \'%1\' has already been declared',
        IllegalContinue: 'Illegal continue statement',
        IllegalBreak: 'Illegal break statement',
        IllegalDuplicateClassProperty: 'Illegal duplicate property in class definition',
        IllegalReturn: 'Illegal return statement',
        IllegalSpread: 'Illegal spread element',
        StrictModeWith:  'Strict mode code may not include a with statement',
        StrictCatchVariable:  'Catch variable may not be eval or arguments in strict mode',
        StrictVarName:  'Variable name may not be eval or arguments in strict mode',
        StrictParamName:  'Parameter name eval or arguments is not allowed in strict mode',
        StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
        ParameterAfterRestParameter: 'Rest parameter must be final parameter of an argument list',
        DefaultRestParameter: 'Rest parameter can not have a default value',
        ElementAfterSpreadElement: 'Spread must be the final element of an element list',
        PropertyAfterSpreadProperty: 'A rest property must be the final property of an object literal',
        ObjectPatternAsRestParameter: 'Invalid rest parameter',
        ObjectPatternAsSpread: 'Invalid spread argument',
        StrictFunctionName:  'Function name may not be eval or arguments in strict mode',
        StrictOctalLiteral:  'Octal literals are not allowed in strict mode.',
        StrictDelete:  'Delete of an unqualified identifier in strict mode.',
        StrictDuplicateProperty:  'Duplicate data property in object literal not allowed in strict mode',
        AccessorDataProperty:  'Object literal may not have data and accessor property with the same name',
        AccessorGetSet:  'Object literal may not have multiple get/set accessors with the same name',
        StrictLHSAssignment:  'Assignment to eval or arguments is not allowed in strict mode',
        StrictLHSPostfix:  'Postfix increment/decrement may not have eval or arguments operand in strict mode',
        StrictLHSPrefix:  'Prefix increment/decrement may not have eval or arguments operand in strict mode',
        StrictReservedWord:  'Use of future reserved word in strict mode',
        MissingFromClause: 'Missing from clause',
        NoAsAfterImportNamespace: 'Missing as after import *',
        InvalidModuleSpecifier: 'Invalid module specifier',
        NoUnintializedConst: 'Const must be initialized',
        ComprehensionRequiresBlock: 'Comprehension must have at least one block',
        ComprehensionError:  'Comprehension Error',
        EachNotAllowed:  'Each is not supported',
        InvalidXJSAttributeValue: 'XJS value should be either an expression or a quoted XJS text',
        ExpectedXJSClosingTag: 'Expected corresponding XJS closing tag for %0',
        AdjacentXJSElements: 'Adjacent XJS elements must be wrapped in an enclosing tag',
        ConfusedAboutFunctionType: 'Unexpected token =>. It looks like ' +
            'you are trying to write a function type, but you ended up ' +
            'writing a grouped type followed by an =>, which is a syntax ' +
            'error. Remember, function type parameters are named so function ' +
            'types look like (name1: type1, name2: type2) => returnType. You ' +
            'probably wrote (type1) => returnType'
    };

    // See also tools/generate-unicode-regex.py.
    Regex = {
        NonAsciiIdentifierStart: new RegExp('[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]'),
        NonAsciiIdentifierPart: new RegExp('[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0300-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u0483-\u0487\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u05d0-\u05ea\u05f0-\u05f2\u0610-\u061a\u0620-\u0669\u066e-\u06d3\u06d5-\u06dc\u06df-\u06e8\u06ea-\u06fc\u06ff\u0710-\u074a\u074d-\u07b1\u07c0-\u07f5\u07fa\u0800-\u082d\u0840-\u085b\u08a0\u08a2-\u08ac\u08e4-\u08fe\u0900-\u0963\u0966-\u096f\u0971-\u0977\u0979-\u097f\u0981-\u0983\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bc-\u09c4\u09c7\u09c8\u09cb-\u09ce\u09d7\u09dc\u09dd\u09df-\u09e3\u09e6-\u09f1\u0a01-\u0a03\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a59-\u0a5c\u0a5e\u0a66-\u0a75\u0a81-\u0a83\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abc-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ad0\u0ae0-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3c-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5c\u0b5d\u0b5f-\u0b63\u0b66-\u0b6f\u0b71\u0b82\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd0\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c58\u0c59\u0c60-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbc-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0cde\u0ce0-\u0ce3\u0ce6-\u0cef\u0cf1\u0cf2\u0d02\u0d03\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d-\u0d44\u0d46-\u0d48\u0d4a-\u0d4e\u0d57\u0d60-\u0d63\u0d66-\u0d6f\u0d7a-\u0d7f\u0d82\u0d83\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e01-\u0e3a\u0e40-\u0e4e\u0e50-\u0e59\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb9\u0ebb-\u0ebd\u0ec0-\u0ec4\u0ec6\u0ec8-\u0ecd\u0ed0-\u0ed9\u0edc-\u0edf\u0f00\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e-\u0f47\u0f49-\u0f6c\u0f71-\u0f84\u0f86-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1049\u1050-\u109d\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u135d-\u135f\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176c\u176e-\u1770\u1772\u1773\u1780-\u17d3\u17d7\u17dc\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1820-\u1877\u1880-\u18aa\u18b0-\u18f5\u1900-\u191c\u1920-\u192b\u1930-\u193b\u1946-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u19d0-\u19d9\u1a00-\u1a1b\u1a20-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1aa7\u1b00-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1bf3\u1c00-\u1c37\u1c40-\u1c49\u1c4d-\u1c7d\u1cd0-\u1cd2\u1cd4-\u1cf6\u1d00-\u1de6\u1dfc-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u200c\u200d\u203f\u2040\u2054\u2071\u207f\u2090-\u209c\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d7f-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2de0-\u2dff\u2e2f\u3005-\u3007\u3021-\u302f\u3031-\u3035\u3038-\u303c\u3041-\u3096\u3099\u309a\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua62b\ua640-\ua66f\ua674-\ua67d\ua67f-\ua697\ua69f-\ua6f1\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua827\ua840-\ua873\ua880-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f7\ua8fb\ua900-\ua92d\ua930-\ua953\ua960-\ua97c\ua980-\ua9c0\ua9cf-\ua9d9\uaa00-\uaa36\uaa40-\uaa4d\uaa50-\uaa59\uaa60-\uaa76\uaa7a\uaa7b\uaa80-\uaac2\uaadb-\uaadd\uaae0-\uaaef\uaaf2-\uaaf6\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabea\uabec\uabed\uabf0-\uabf9\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff3f\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]'),
        LeadingZeros: new RegExp('^0+(?!$)')
    };

    // Ensure the condition is true, otherwise throw an error.
    // This is only to have a better contract semantic, i.e. another safety net
    // to catch a logic error. The condition shall be fulfilled in normal case.
    // Do NOT use this to enforce a certain condition on any user input.

    function assert(condition, message) {
        if (!condition) {
            throw new Error('ASSERT: ' + message);
        }
    }

    function isDecimalDigit(ch) {
        return (ch >= 48 && ch <= 57);   // 0..9
    }

    function isHexDigit(ch) {
        return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
    }

    function isOctalDigit(ch) {
        return '01234567'.indexOf(ch) >= 0;
    }


    // 7.2 White Space

    function isWhiteSpace(ch) {
        return (ch === 32) ||  // space
            (ch === 9) ||      // tab
            (ch === 0xB) ||
            (ch === 0xC) ||
            (ch === 0xA0) ||
            (ch >= 0x1680 && '\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFF'.indexOf(String.fromCharCode(ch)) > 0);
    }

    // 7.3 Line Terminators

    function isLineTerminator(ch) {
        return (ch === 10) || (ch === 13) || (ch === 0x2028) || (ch === 0x2029);
    }

    // 7.6 Identifier Names and Identifiers

    function isIdentifierStart(ch) {
        return (ch === 36) || (ch === 95) ||  // $ (dollar) and _ (underscore)
            (ch >= 65 && ch <= 90) ||         // A..Z
            (ch >= 97 && ch <= 122) ||        // a..z
            (ch === 92) ||                    // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(String.fromCharCode(ch)));
    }

    function isIdentifierPart(ch) {
        return (ch === 36) || (ch === 95) ||  // $ (dollar) and _ (underscore)
            (ch >= 65 && ch <= 90) ||         // A..Z
            (ch >= 97 && ch <= 122) ||        // a..z
            (ch >= 48 && ch <= 57) ||         // 0..9
            (ch === 92) ||                    // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(String.fromCharCode(ch)));
    }

    // 7.6.1.2 Future Reserved Words

    function isFutureReservedWord(id) {
        switch (id) {
        case 'class':
        case 'enum':
        case 'export':
        case 'extends':
        case 'import':
        case 'super':
            return true;
        default:
            return false;
        }
    }

    function isStrictModeReservedWord(id) {
        switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'yield':
        case 'let':
            return true;
        default:
            return false;
        }
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    // 7.6.1.1 Keywords

    function isKeyword(id) {
        if (strict && isStrictModeReservedWord(id)) {
            return true;
        }

        // 'const' is specialized as Keyword in V8.
        // 'yield' is only treated as a keyword in strict mode.
        // 'let' is for compatiblity with SpiderMonkey and ES.next.
        // Some others are from future reserved words.

        switch (id.length) {
        case 2:
            return (id === 'if') || (id === 'in') || (id === 'do');
        case 3:
            return (id === 'var') || (id === 'for') || (id === 'new') ||
                (id === 'try') || (id === 'let');
        case 4:
            return (id === 'this') || (id === 'else') || (id === 'case') ||
                (id === 'void') || (id === 'with') || (id === 'enum');
        case 5:
            return (id === 'while') || (id === 'break') || (id === 'catch') ||
                (id === 'throw') || (id === 'const') ||
                (id === 'class') || (id === 'super');
        case 6:
            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                (id === 'switch') || (id === 'export') || (id === 'import');
        case 7:
            return (id === 'default') || (id === 'finally') || (id === 'extends');
        case 8:
            return (id === 'function') || (id === 'continue') || (id === 'debugger');
        case 10:
            return (id === 'instanceof');
        default:
            return false;
        }
    }

    // 7.4 Comments

    function skipComment() {
        var ch, blockComment, lineComment;

        blockComment = false;
        lineComment = false;

        while (index < length) {
            ch = source.charCodeAt(index);

            if (lineComment) {
                ++index;
                if (isLineTerminator(ch)) {
                    lineComment = false;
                    if (ch === 13 && source.charCodeAt(index) === 10) {
                        ++index;
                    }
                    ++lineNumber;
                    lineStart = index;
                }
            } else if (blockComment) {
                if (isLineTerminator(ch)) {
                    if (ch === 13) {
                        ++index;
                    }
                    if (ch !== 13 || source.charCodeAt(index) === 10) {
                        ++lineNumber;
                        ++index;
                        lineStart = index;
                        if (index >= length) {
                            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                        }
                    }
                } else {
                    ch = source.charCodeAt(index++);
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                    // Block comment ends with '*/' (char #42, char #47).
                    if (ch === 42) {
                        ch = source.charCodeAt(index);
                        if (ch === 47) {
                            ++index;
                            blockComment = false;
                        }
                    }
                }
            } else if (ch === 47) {
                ch = source.charCodeAt(index + 1);
                // Line comment starts with '//' (char #47, char #47).
                if (ch === 47) {
                    index += 2;
                    lineComment = true;
                } else if (ch === 42) {
                    // Block comment starts with '/*' (char #47, char #42).
                    index += 2;
                    blockComment = true;
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                } else {
                    break;
                }
            } else if (isWhiteSpace(ch)) {
                ++index;
            } else if (isLineTerminator(ch)) {
                ++index;
                if (ch === 13 && source.charCodeAt(index) === 10) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
            } else {
                break;
            }
        }
    }

    function scanHexEscape(prefix) {
        var i, len, ch, code = 0;

        len = (prefix === 'u') ? 4 : 2;
        for (i = 0; i < len; ++i) {
            if (index < length && isHexDigit(source[index])) {
                ch = source[index++];
                code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
            } else {
                return '';
            }
        }
        return String.fromCharCode(code);
    }

    function scanUnicodeCodePointEscape() {
        var ch, code, cu1, cu2;

        ch = source[index];
        code = 0;

        // At least, one hex digit is required.
        if (ch === '}') {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        while (index < length) {
            ch = source[index++];
            if (!isHexDigit(ch)) {
                break;
            }
            code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
        }

        if (code > 0x10FFFF || ch !== '}') {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        // UTF-16 Encoding
        if (code <= 0xFFFF) {
            return String.fromCharCode(code);
        }
        cu1 = ((code - 0x10000) >> 10) + 0xD800;
        cu2 = ((code - 0x10000) & 1023) + 0xDC00;
        return String.fromCharCode(cu1, cu2);
    }

    function getEscapedIdentifier() {
        var ch, id;

        ch = source.charCodeAt(index++);
        id = String.fromCharCode(ch);

        // '\u' (char #92, char #117) denotes an escaped character.
        if (ch === 92) {
            if (source.charCodeAt(index) !== 117) {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            ++index;
            ch = scanHexEscape('u');
            if (!ch || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            id = ch;
        }

        while (index < length) {
            ch = source.charCodeAt(index);
            if (!isIdentifierPart(ch)) {
                break;
            }
            ++index;
            id += String.fromCharCode(ch);

            // '\u' (char #92, char #117) denotes an escaped character.
            if (ch === 92) {
                id = id.substr(0, id.length - 1);
                if (source.charCodeAt(index) !== 117) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
                ++index;
                ch = scanHexEscape('u');
                if (!ch || ch === '\\' || !isIdentifierPart(ch.charCodeAt(0))) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
                id += ch;
            }
        }

        return id;
    }

    function getIdentifier() {
        var start, ch;

        start = index++;
        while (index < length) {
            ch = source.charCodeAt(index);
            if (ch === 92) {
                // Blackslash (char #92) marks Unicode escape sequence.
                index = start;
                return getEscapedIdentifier();
            }
            if (isIdentifierPart(ch)) {
                ++index;
            } else {
                break;
            }
        }

        return source.slice(start, index);
    }

    function scanIdentifier() {
        var start, id, type;

        start = index;

        // Backslash (char #92) starts an escaped character.
        id = (source.charCodeAt(index) === 92) ? getEscapedIdentifier() : getIdentifier();

        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        if (id.length === 1) {
            type = Token.Identifier;
        } else if (isKeyword(id)) {
            type = Token.Keyword;
        } else if (id === 'null') {
            type = Token.NullLiteral;
        } else if (id === 'true' || id === 'false') {
            type = Token.BooleanLiteral;
        } else {
            type = Token.Identifier;
        }

        return {
            type: type,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }


    // 7.7 Punctuators

    function scanPunctuator() {
        var start = index,
            code = source.charCodeAt(index),
            code2,
            ch1 = source[index],
            ch2,
            ch3,
            ch4;

        switch (code) {
        // Check for most common single-character punctuators.
        case 40:   // ( open bracket
        case 41:   // ) close bracket
        case 59:   // ; semicolon
        case 44:   // , comma
        case 123:  // { open curly brace
        case 125:  // } close curly brace
        case 91:   // [
        case 93:   // ]
        case 58:   // :
        case 63:   // ?
        case 126:  // ~
            ++index;
            if (extra.tokenize) {
                if (code === 40) {
                    extra.openParenToken = extra.tokens.length;
                } else if (code === 123) {
                    extra.openCurlyToken = extra.tokens.length;
                }
            }
            return {
                type: Token.Punctuator,
                value: String.fromCharCode(code),
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };

        default:
            code2 = source.charCodeAt(index + 1);

            // '=' (char #61) marks an assignment or comparison operator.
            if (code2 === 61) {
                switch (code) {
                case 37:  // %
                case 38:  // &
                case 42:  // *:
                case 43:  // +
                case 45:  // -
                case 47:  // /
                case 60:  // <
                case 62:  // >
                case 94:  // ^
                case 124: // |
                    index += 2;
                    return {
                        type: Token.Punctuator,
                        value: String.fromCharCode(code) + String.fromCharCode(code2),
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        range: [start, index]
                    };

                case 33: // !
                case 61: // =
                    index += 2;

                    // !== and ===
                    if (source.charCodeAt(index) === 61) {
                        ++index;
                    }
                    return {
                        type: Token.Punctuator,
                        value: source.slice(start, index),
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        range: [start, index]
                    };
                default:
                    break;
                }
            }
            break;
        }

        // Peek more characters.

        ch2 = source[index + 1];
        ch3 = source[index + 2];
        ch4 = source[index + 3];

        // 4-character punctuator: >>>=

        if (ch1 === '>' && ch2 === '>' && ch3 === '>') {
            if (ch4 === '=') {
                index += 4;
                return {
                    type: Token.Punctuator,
                    value: '>>>=',
                    lineNumber: lineNumber,
                    lineStart: lineStart,
                    range: [start, index]
                };
            }
        }

        // 3-character punctuators: === !== >>> <<= >>=

        if (ch1 === '>' && ch2 === '>' && ch3 === '>') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '>>>',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '<' && ch2 === '<' && ch3 === '=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '<<=',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '>' && ch2 === '>' && ch3 === '=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '>>=',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '.' && ch2 === '.' && ch3 === '.') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '...',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // Other 2-character punctuators: ++ -- << >> && ||

        // Don't match these tokens if we're in a type, since they never can
        // occur and can mess up types like Map<string, Array<string>>
        if (ch1 === ch2 && ('+-<>&|'.indexOf(ch1) >= 0) && !state.inType) {
            index += 2;
            return {
                type: Token.Punctuator,
                value: ch1 + ch2,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '=' && ch2 === '>') {
            index += 2;
            return {
                type: Token.Punctuator,
                value: '=>',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
            ++index;
            return {
                type: Token.Punctuator,
                value: ch1,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '.') {
            ++index;
            return {
                type: Token.Punctuator,
                value: ch1,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
    }

    // 7.8.3 Numeric Literals

    function scanHexLiteral(start) {
        var number = '';

        while (index < length) {
            if (!isHexDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (number.length === 0) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt('0x' + number, 16),
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    function scanOctalLiteral(prefix, start) {
        var number, octal;

        if (isOctalDigit(prefix)) {
            octal = true;
            number = '0' + source[index++];
        } else {
            octal = false;
            ++index;
            number = '';
        }

        while (index < length) {
            if (!isOctalDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (!octal && number.length === 0) {
            // only 0o or 0O
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        if (isIdentifierStart(source.charCodeAt(index)) || isDecimalDigit(source.charCodeAt(index))) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 8),
            octal: octal,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    function scanNumericLiteral() {
        var number, start, ch, octal;

        ch = source[index];
        assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
            'Numeric literal must start with a decimal digit or a decimal point');

        start = index;
        number = '';
        if (ch !== '.') {
            number = source[index++];
            ch = source[index];

            // Hex number starts with '0x'.
            // Octal number starts with '0'.
            // Octal number in ES6 starts with '0o'.
            // Binary number in ES6 starts with '0b'.
            if (number === '0') {
                if (ch === 'x' || ch === 'X') {
                    ++index;
                    return scanHexLiteral(start);
                }
                if (ch === 'b' || ch === 'B') {
                    ++index;
                    number = '';

                    while (index < length) {
                        ch = source[index];
                        if (ch !== '0' && ch !== '1') {
                            break;
                        }
                        number += source[index++];
                    }

                    if (number.length === 0) {
                        // only 0b or 0B
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }

                    if (index < length) {
                        ch = source.charCodeAt(index);
                        if (isIdentifierStart(ch) || isDecimalDigit(ch)) {
                            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                        }
                    }
                    return {
                        type: Token.NumericLiteral,
                        value: parseInt(number, 2),
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        range: [start, index]
                    };
                }
                if (ch === 'o' || ch === 'O' || isOctalDigit(ch)) {
                    return scanOctalLiteral(ch, start);
                }
                // decimal number starts with '0' such as '09' is illegal.
                if (ch && isDecimalDigit(ch.charCodeAt(0))) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
            }

            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === '.') {
            number += source[index++];
            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === 'e' || ch === 'E') {
            number += source[index++];

            ch = source[index];
            if (ch === '+' || ch === '-') {
                number += source[index++];
            }
            if (isDecimalDigit(source.charCodeAt(index))) {
                while (isDecimalDigit(source.charCodeAt(index))) {
                    number += source[index++];
                }
            } else {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.NumericLiteral,
            value: parseFloat(number),
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    // 7.8.4 String Literals

    function scanStringLiteral() {
        var str = '', quote, start, ch, code, unescaped, restore, octal = false;

        quote = source[index];
        assert((quote === '\'' || quote === '"'),
            'String literal must starts with a quote');

        start = index;
        ++index;

        while (index < length) {
            ch = source[index++];

            if (ch === quote) {
                quote = '';
                break;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                    case 'n':
                        str += '\n';
                        break;
                    case 'r':
                        str += '\r';
                        break;
                    case 't':
                        str += '\t';
                        break;
                    case 'u':
                    case 'x':
                        if (source[index] === '{') {
                            ++index;
                            str += scanUnicodeCodePointEscape();
                        } else {
                            restore = index;
                            unescaped = scanHexEscape(ch);
                            if (unescaped) {
                                str += unescaped;
                            } else {
                                index = restore;
                                str += ch;
                            }
                        }
                        break;
                    case 'b':
                        str += '\b';
                        break;
                    case 'f':
                        str += '\f';
                        break;
                    case 'v':
                        str += '\x0B';
                        break;

                    default:
                        if (isOctalDigit(ch)) {
                            code = '01234567'.indexOf(ch);

                            // \0 is not octal escape sequence
                            if (code !== 0) {
                                octal = true;
                            }

                            if (index < length && isOctalDigit(source[index])) {
                                octal = true;
                                code = code * 8 + '01234567'.indexOf(source[index++]);

                                // 3 digits are only allowed when string starts
                                // with 0, 1, 2, 3
                                if ('0123'.indexOf(ch) >= 0 &&
                                        index < length &&
                                        isOctalDigit(source[index])) {
                                    code = code * 8 + '01234567'.indexOf(source[index++]);
                                }
                            }
                            str += String.fromCharCode(code);
                        } else {
                            str += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch ===  '\r' && source[index] === '\n') {
                        ++index;
                    }
                    lineStart = index;
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                break;
            } else {
                str += ch;
            }
        }

        if (quote !== '') {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.StringLiteral,
            value: str,
            octal: octal,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    function scanTemplate() {
        var cooked = '', ch, start, terminated, tail, restore, unescaped, code, octal;

        terminated = false;
        tail = false;
        start = index;

        ++index;

        while (index < length) {
            ch = source[index++];
            if (ch === '`') {
                tail = true;
                terminated = true;
                break;
            } else if (ch === '$') {
                if (source[index] === '{') {
                    ++index;
                    terminated = true;
                    break;
                }
                cooked += ch;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                    case 'n':
                        cooked += '\n';
                        break;
                    case 'r':
                        cooked += '\r';
                        break;
                    case 't':
                        cooked += '\t';
                        break;
                    case 'u':
                    case 'x':
                        if (source[index] === '{') {
                            ++index;
                            cooked += scanUnicodeCodePointEscape();
                        } else {
                            restore = index;
                            unescaped = scanHexEscape(ch);
                            if (unescaped) {
                                cooked += unescaped;
                            } else {
                                index = restore;
                                cooked += ch;
                            }
                        }
                        break;
                    case 'b':
                        cooked += '\b';
                        break;
                    case 'f':
                        cooked += '\f';
                        break;
                    case 'v':
                        cooked += '\v';
                        break;

                    default:
                        if (isOctalDigit(ch)) {
                            code = '01234567'.indexOf(ch);

                            // \0 is not octal escape sequence
                            if (code !== 0) {
                                octal = true;
                            }

                            if (index < length && isOctalDigit(source[index])) {
                                octal = true;
                                code = code * 8 + '01234567'.indexOf(source[index++]);

                                // 3 digits are only allowed when string starts
                                // with 0, 1, 2, 3
                                if ('0123'.indexOf(ch) >= 0 &&
                                        index < length &&
                                        isOctalDigit(source[index])) {
                                    code = code * 8 + '01234567'.indexOf(source[index++]);
                                }
                            }
                            cooked += String.fromCharCode(code);
                        } else {
                            cooked += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch ===  '\r' && source[index] === '\n') {
                        ++index;
                    }
                    lineStart = index;
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                ++lineNumber;
                if (ch ===  '\r' && source[index] === '\n') {
                    ++index;
                }
                lineStart = index;
                cooked += '\n';
            } else {
                cooked += ch;
            }
        }

        if (!terminated) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.Template,
            value: {
                cooked: cooked,
                raw: source.slice(start + 1, index - ((tail) ? 1 : 2))
            },
            tail: tail,
            octal: octal,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    function scanTemplateElement(option) {
        var startsWith, template;

        lookahead = null;
        skipComment();

        startsWith = (option.head) ? '`' : '}';

        if (source[index] !== startsWith) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        template = scanTemplate();

        peek();

        return template;
    }

    function scanRegExp() {
        var str, ch, start, pattern, flags, value, classMarker = false, restore, terminated = false, tmp;

        lookahead = null;
        skipComment();

        start = index;
        ch = source[index];
        assert(ch === '/', 'Regular expression literal must start with a slash');
        str = source[index++];

        while (index < length) {
            ch = source[index++];
            str += ch;
            if (classMarker) {
                if (ch === ']') {
                    classMarker = false;
                }
            } else {
                if (ch === '\\') {
                    ch = source[index++];
                    // ECMA-262 7.8.5
                    if (isLineTerminator(ch.charCodeAt(0))) {
                        throwError({}, Messages.UnterminatedRegExp);
                    }
                    str += ch;
                } else if (ch === '/') {
                    terminated = true;
                    break;
                } else if (ch === '[') {
                    classMarker = true;
                } else if (isLineTerminator(ch.charCodeAt(0))) {
                    throwError({}, Messages.UnterminatedRegExp);
                }
            }
        }

        if (!terminated) {
            throwError({}, Messages.UnterminatedRegExp);
        }

        // Exclude leading and trailing slash.
        pattern = str.substr(1, str.length - 2);

        flags = '';
        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch.charCodeAt(0))) {
                break;
            }

            ++index;
            if (ch === '\\' && index < length) {
                ch = source[index];
                if (ch === 'u') {
                    ++index;
                    restore = index;
                    ch = scanHexEscape('u');
                    if (ch) {
                        flags += ch;
                        for (str += '\\u'; restore < index; ++restore) {
                            str += source[restore];
                        }
                    } else {
                        index = restore;
                        flags += 'u';
                        str += '\\u';
                    }
                } else {
                    str += '\\';
                }
            } else {
                flags += ch;
                str += ch;
            }
        }

        tmp = pattern;
        if (flags.indexOf('u') >= 0) {
            // Replace each astral symbol and every Unicode code point
            // escape sequence that represents such a symbol with a single
            // ASCII symbol to avoid throwing on regular expressions that
            // are only valid in combination with the `/u` flag.
            tmp = tmp
                .replace(/\\u\{([0-9a-fA-F]{5,6})\}/g, 'x')
                .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, 'x');
        }

        // First, detect invalid regular expressions.
        try {
            value = new RegExp(tmp);
        } catch (e) {
            throwError({}, Messages.InvalidRegExp);
        }

        // Return a regular expression object for this pattern-flag pair, or
        // `null` in case the current environment doesn't support the flags it
        // uses.
        try {
            value = new RegExp(pattern, flags);
        } catch (exception) {
            value = null;
        }

        peek();

        if (extra.tokenize) {
            return {
                type: Token.RegularExpression,
                value: value,
                regex: {
                    pattern: pattern,
                    flags: flags
                },
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }
        return {
            literal: str,
            value: value,
            regex: {
                pattern: pattern,
                flags: flags
            },
            range: [start, index]
        };
    }

    function isIdentifierName(token) {
        return token.type === Token.Identifier ||
            token.type === Token.Keyword ||
            token.type === Token.BooleanLiteral ||
            token.type === Token.NullLiteral;
    }

    function advanceSlash() {
        var prevToken,
            checkToken;
        // Using the following algorithm:
        // https://github.com/mozilla/sweet.js/wiki/design
        prevToken = extra.tokens[extra.tokens.length - 1];
        if (!prevToken) {
            // Nothing before that: it cannot be a division.
            return scanRegExp();
        }
        if (prevToken.type === 'Punctuator') {
            if (prevToken.value === ')') {
                checkToken = extra.tokens[extra.openParenToken - 1];
                if (checkToken &&
                        checkToken.type === 'Keyword' &&
                        (checkToken.value === 'if' ||
                         checkToken.value === 'while' ||
                         checkToken.value === 'for' ||
                         checkToken.value === 'with')) {
                    return scanRegExp();
                }
                return scanPunctuator();
            }
            if (prevToken.value === '}') {
                // Dividing a function by anything makes little sense,
                // but we have to check for that.
                if (extra.tokens[extra.openCurlyToken - 3] &&
                        extra.tokens[extra.openCurlyToken - 3].type === 'Keyword') {
                    // Anonymous function.
                    checkToken = extra.tokens[extra.openCurlyToken - 4];
                    if (!checkToken) {
                        return scanPunctuator();
                    }
                } else if (extra.tokens[extra.openCurlyToken - 4] &&
                        extra.tokens[extra.openCurlyToken - 4].type === 'Keyword') {
                    // Named function.
                    checkToken = extra.tokens[extra.openCurlyToken - 5];
                    if (!checkToken) {
                        return scanRegExp();
                    }
                } else {
                    return scanPunctuator();
                }
                // checkToken determines whether the function is
                // a declaration or an expression.
                if (FnExprTokens.indexOf(checkToken.value) >= 0) {
                    // It is an expression.
                    return scanPunctuator();
                }
                // It is a declaration.
                return scanRegExp();
            }
            return scanRegExp();
        }
        if (prevToken.type === 'Keyword') {
            return scanRegExp();
        }
        return scanPunctuator();
    }

    function advance() {
        var ch;

        if (!state.inXJSChild) {
            skipComment();
        }

        if (index >= length) {
            return {
                type: Token.EOF,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [index, index]
            };
        }

        if (state.inXJSChild) {
            return advanceXJSChild();
        }

        ch = source.charCodeAt(index);

        // Very common: ( and ) and ;
        if (ch === 40 || ch === 41 || ch === 58) {
            return scanPunctuator();
        }

        // String literal starts with single quote (#39) or double quote (#34).
        if (ch === 39 || ch === 34) {
            if (state.inXJSTag) {
                return scanXJSStringLiteral();
            }
            return scanStringLiteral();
        }

        if (state.inXJSTag && isXJSIdentifierStart(ch)) {
            return scanXJSIdentifier();
        }

        if (ch === 96) {
            return scanTemplate();
        }
        if (isIdentifierStart(ch)) {
            return scanIdentifier();
        }

        // Dot (.) char #46 can also start a floating-point number, hence the need
        // to check the next character.
        if (ch === 46) {
            if (isDecimalDigit(source.charCodeAt(index + 1))) {
                return scanNumericLiteral();
            }
            return scanPunctuator();
        }

        if (isDecimalDigit(ch)) {
            return scanNumericLiteral();
        }

        // Slash (/) char #47 can also start a regex.
        if (extra.tokenize && ch === 47) {
            return advanceSlash();
        }

        return scanPunctuator();
    }

    function lex() {
        var token;

        token = lookahead;
        index = token.range[1];
        lineNumber = token.lineNumber;
        lineStart = token.lineStart;

        lookahead = advance();

        index = token.range[1];
        lineNumber = token.lineNumber;
        lineStart = token.lineStart;

        return token;
    }

    function peek() {
        var pos, line, start;

        pos = index;
        line = lineNumber;
        start = lineStart;
        lookahead = advance();
        index = pos;
        lineNumber = line;
        lineStart = start;
    }

    function lookahead2() {
        var adv, pos, line, start, result;

        // If we are collecting the tokens, don't grab the next one yet.
        adv = (typeof extra.advance === 'function') ? extra.advance : advance;

        pos = index;
        line = lineNumber;
        start = lineStart;

        // Scan for the next immediate token.
        if (lookahead === null) {
            lookahead = adv();
        }
        index = lookahead.range[1];
        lineNumber = lookahead.lineNumber;
        lineStart = lookahead.lineStart;

        // Grab the token right after.
        result = adv();
        index = pos;
        lineNumber = line;
        lineStart = start;

        return result;
    }

    function rewind(token) {
        index = token.range[0];
        lineNumber = token.lineNumber;
        lineStart = token.lineStart;
        lookahead = token;
    }

    function markerCreate() {
        if (!extra.loc && !extra.range) {
            return undefined;
        }
        skipComment();
        return {offset: index, line: lineNumber, col: index - lineStart};
    }

    function markerCreatePreserveWhitespace() {
        if (!extra.loc && !extra.range) {
            return undefined;
        }
        return {offset: index, line: lineNumber, col: index - lineStart};
    }

    function processComment(node) {
        var lastChild,
            trailingComments,
            bottomRight = extra.bottomRightStack,
            last = bottomRight[bottomRight.length - 1];

        if (node.type === Syntax.Program) {
            if (node.body.length > 0) {
                return;
            }
        }

        if (extra.trailingComments.length > 0) {
            if (extra.trailingComments[0].range[0] >= node.range[1]) {
                trailingComments = extra.trailingComments;
                extra.trailingComments = [];
            } else {
                extra.trailingComments.length = 0;
            }
        } else {
            if (last && last.trailingComments && last.trailingComments[0].range[0] >= node.range[1]) {
                trailingComments = last.trailingComments;
                delete last.trailingComments;
            }
        }

        // Eating the stack.
        if (last) {
            while (last && last.range[0] >= node.range[0]) {
                lastChild = last;
                last = bottomRight.pop();
            }
        }

        if (lastChild) {
            if (lastChild.leadingComments && lastChild.leadingComments[lastChild.leadingComments.length - 1].range[1] <= node.range[0]) {
                node.leadingComments = lastChild.leadingComments;
                delete lastChild.leadingComments;
            }
        } else if (extra.leadingComments.length > 0 && extra.leadingComments[extra.leadingComments.length - 1].range[1] <= node.range[0]) {
            node.leadingComments = extra.leadingComments;
            extra.leadingComments = [];
        }

        if (trailingComments) {
            node.trailingComments = trailingComments;
        }

        bottomRight.push(node);
    }

    function markerApply(marker, node) {
        if (extra.range) {
            node.range = [marker.offset, index];
        }
        if (extra.loc) {
            node.loc = {
                start: {
                    line: marker.line,
                    column: marker.col
                },
                end: {
                    line: lineNumber,
                    column: index - lineStart
                }
            };
            node = delegate.postProcess(node);
        }
        if (extra.attachComment) {
            processComment(node);
        }
        return node;
    }

    SyntaxTreeDelegate = {

        name: 'SyntaxTree',

        postProcess: function (node) {
            return node;
        },

        createArrayExpression: function (elements) {
            return {
                type: Syntax.ArrayExpression,
                elements: elements
            };
        },

        createAssignmentExpression: function (operator, left, right) {
            return {
                type: Syntax.AssignmentExpression,
                operator: operator,
                left: left,
                right: right
            };
        },

        createBinaryExpression: function (operator, left, right) {
            var type = (operator === '||' || operator === '&&') ? Syntax.LogicalExpression :
                        Syntax.BinaryExpression;
            return {
                type: type,
                operator: operator,
                left: left,
                right: right
            };
        },

        createBlockStatement: function (body) {
            return {
                type: Syntax.BlockStatement,
                body: body
            };
        },

        createBreakStatement: function (label) {
            return {
                type: Syntax.BreakStatement,
                label: label
            };
        },

        createCallExpression: function (callee, args) {
            return {
                type: Syntax.CallExpression,
                callee: callee,
                'arguments': args
            };
        },

        createCatchClause: function (param, body) {
            return {
                type: Syntax.CatchClause,
                param: param,
                body: body
            };
        },

        createConditionalExpression: function (test, consequent, alternate) {
            return {
                type: Syntax.ConditionalExpression,
                test: test,
                consequent: consequent,
                alternate: alternate
            };
        },

        createContinueStatement: function (label) {
            return {
                type: Syntax.ContinueStatement,
                label: label
            };
        },

        createDebuggerStatement: function () {
            return {
                type: Syntax.DebuggerStatement
            };
        },

        createDoWhileStatement: function (body, test) {
            return {
                type: Syntax.DoWhileStatement,
                body: body,
                test: test
            };
        },

        createEmptyStatement: function () {
            return {
                type: Syntax.EmptyStatement
            };
        },

        createExpressionStatement: function (expression) {
            return {
                type: Syntax.ExpressionStatement,
                expression: expression
            };
        },

        createForStatement: function (init, test, update, body) {
            return {
                type: Syntax.ForStatement,
                init: init,
                test: test,
                update: update,
                body: body
            };
        },

        createForInStatement: function (left, right, body) {
            return {
                type: Syntax.ForInStatement,
                left: left,
                right: right,
                body: body,
                each: false
            };
        },

        createForOfStatement: function (left, right, body) {
            return {
                type: Syntax.ForOfStatement,
                left: left,
                right: right,
                body: body
            };
        },

        createFunctionDeclaration: function (id, params, defaults, body, rest, generator, expression,
                                             isAsync, returnType, typeParameters) {
            var funDecl = {
                type: Syntax.FunctionDeclaration,
                id: id,
                params: params,
                defaults: defaults,
                body: body,
                rest: rest,
                generator: generator,
                expression: expression,
                returnType: returnType,
                typeParameters: typeParameters
            };

            if (isAsync) {
                funDecl.async = true;
            }

            return funDecl;
        },

        createFunctionExpression: function (id, params, defaults, body, rest, generator, expression,
                                            isAsync, returnType, typeParameters) {
            var funExpr = {
                type: Syntax.FunctionExpression,
                id: id,
                params: params,
                defaults: defaults,
                body: body,
                rest: rest,
                generator: generator,
                expression: expression,
                returnType: returnType,
                typeParameters: typeParameters
            };

            if (isAsync) {
                funExpr.async = true;
            }

            return funExpr;
        },

        createIdentifier: function (name) {
            return {
                type: Syntax.Identifier,
                name: name,
                // Only here to initialize the shape of the object to ensure
                // that the 'typeAnnotation' key is ordered before others that
                // are added later (like 'loc' and 'range'). This just helps
                // keep the shape of Identifier nodes consistent with everything
                // else.
                typeAnnotation: undefined,
                optional: undefined
            };
        },

        createTypeAnnotation: function (typeAnnotation) {
            return {
                type: Syntax.TypeAnnotation,
                typeAnnotation: typeAnnotation
            };
        },

        createFunctionTypeAnnotation: function (params, returnType, rest, typeParameters) {
            return {
                type: Syntax.FunctionTypeAnnotation,
                params: params,
                returnType: returnType,
                rest: rest,
                typeParameters: typeParameters
            };
        },

        createFunctionTypeParam: function (name, typeAnnotation, optional) {
            return {
                type: Syntax.FunctionTypeParam,
                name: name,
                typeAnnotation: typeAnnotation,
                optional: optional
            };
        },

        createNullableTypeAnnotation: function (typeAnnotation) {
            return {
                type: Syntax.NullableTypeAnnotation,
                typeAnnotation: typeAnnotation
            };
        },

        createArrayTypeAnnotation: function (elementType) {
            return {
                type: Syntax.ArrayTypeAnnotation,
                elementType: elementType
            };
        },

        createGenericTypeAnnotation: function (id, typeParameters) {
            return {
                type: Syntax.GenericTypeAnnotation,
                id: id,
                typeParameters: typeParameters
            };
        },

        createQualifiedTypeIdentifier: function (qualification, id) {
            return {
                type: Syntax.QualifiedTypeIdentifier,
                qualification: qualification,
                id: id
            };
        },

        createTypeParameterDeclaration: function (params) {
            return {
                type: Syntax.TypeParameterDeclaration,
                params: params
            };
        },

        createTypeParameterInstantiation: function (params) {
            return {
                type: Syntax.TypeParameterInstantiation,
                params: params
            };
        },

        createAnyTypeAnnotation: function () {
            return {
                type: Syntax.AnyTypeAnnotation
            };
        },

        createBooleanTypeAnnotation: function () {
            return {
                type: Syntax.BooleanTypeAnnotation
            };
        },

        createNumberTypeAnnotation: function () {
            return {
                type: Syntax.NumberTypeAnnotation
            };
        },

        createStringTypeAnnotation: function () {
            return {
                type: Syntax.StringTypeAnnotation
            };
        },

        createStringLiteralTypeAnnotation: function (token) {
            return {
                type: Syntax.StringLiteralTypeAnnotation,
                value: token.value,
                raw: source.slice(token.range[0], token.range[1])
            };
        },

        createVoidTypeAnnotation: function () {
            return {
                type: Syntax.VoidTypeAnnotation
            };
        },

        createTypeofTypeAnnotation: function (argument) {
            return {
                type: Syntax.TypeofTypeAnnotation,
                argument: argument
            };
        },

        createTupleTypeAnnotation: function (types) {
            return {
                type: Syntax.TupleTypeAnnotation,
                types: types
            };
        },

        createObjectTypeAnnotation: function (properties, indexers, callProperties) {
            return {
                type: Syntax.ObjectTypeAnnotation,
                properties: properties,
                indexers: indexers,
                callProperties: callProperties
            };
        },

        createObjectTypeIndexer: function (id, key, value, isStatic) {
            return {
                type: Syntax.ObjectTypeIndexer,
                id: id,
                key: key,
                value: value,
                static: isStatic
            };
        },

        createObjectTypeCallProperty: function (value, isStatic) {
            return {
                type: Syntax.ObjectTypeCallProperty,
                value: value,
                static: isStatic
            };
        },

        createObjectTypeProperty: function (key, value, optional, isStatic) {
            return {
                type: Syntax.ObjectTypeProperty,
                key: key,
                value: value,
                optional: optional,
                static: isStatic
            };
        },

        createUnionTypeAnnotation: function (types) {
            return {
                type: Syntax.UnionTypeAnnotation,
                types: types
            };
        },

        createIntersectionTypeAnnotation: function (types) {
            return {
                type: Syntax.IntersectionTypeAnnotation,
                types: types
            };
        },

        createTypeAlias: function (id, typeParameters, right) {
            return {
                type: Syntax.TypeAlias,
                id: id,
                typeParameters: typeParameters,
                right: right
            };
        },

        createInterface: function (id, typeParameters, body, extended) {
            return {
                type: Syntax.InterfaceDeclaration,
                id: id,
                typeParameters: typeParameters,
                body: body,
                extends: extended
            };
        },

        createInterfaceExtends: function (id, typeParameters) {
            return {
                type: Syntax.InterfaceExtends,
                id: id,
                typeParameters: typeParameters
            };
        },

        createDeclareFunction: function (id) {
            return {
                type: Syntax.DeclareFunction,
                id: id
            };
        },

        createDeclareVariable: function (id) {
            return {
                type: Syntax.DeclareVariable,
                id: id
            };
        },

        createDeclareModule: function (id, body) {
            return {
                type: Syntax.DeclareModule,
                id: id,
                body: body
            };
        },

        createXJSAttribute: function (name, value) {
            return {
                type: Syntax.XJSAttribute,
                name: name,
                value: value || null
            };
        },

        createXJSSpreadAttribute: function (argument) {
            return {
                type: Syntax.XJSSpreadAttribute,
                argument: argument
            };
        },

        createXJSIdentifier: function (name) {
            return {
                type: Syntax.XJSIdentifier,
                name: name
            };
        },

        createXJSNamespacedName: function (namespace, name) {
            return {
                type: Syntax.XJSNamespacedName,
                namespace: namespace,
                name: name
            };
        },

        createXJSMemberExpression: function (object, property) {
            return {
                type: Syntax.XJSMemberExpression,
                object: object,
                property: property
            };
        },

        createXJSElement: function (openingElement, closingElement, children) {
            return {
                type: Syntax.XJSElement,
                openingElement: openingElement,
                closingElement: closingElement,
                children: children
            };
        },

        createXJSEmptyExpression: function () {
            return {
                type: Syntax.XJSEmptyExpression
            };
        },

        createXJSExpressionContainer: function (expression) {
            return {
                type: Syntax.XJSExpressionContainer,
                expression: expression
            };
        },

        createXJSOpeningElement: function (name, attributes, selfClosing) {
            return {
                type: Syntax.XJSOpeningElement,
                name: name,
                selfClosing: selfClosing,
                attributes: attributes
            };
        },

        createXJSClosingElement: function (name) {
            return {
                type: Syntax.XJSClosingElement,
                name: name
            };
        },

        createIfStatement: function (test, consequent, alternate) {
            return {
                type: Syntax.IfStatement,
                test: test,
                consequent: consequent,
                alternate: alternate
            };
        },

        createLabeledStatement: function (label, body) {
            return {
                type: Syntax.LabeledStatement,
                label: label,
                body: body
            };
        },

        createLiteral: function (token) {
            var object = {
                type: Syntax.Literal,
                value: token.value,
                raw: source.slice(token.range[0], token.range[1])
            };
            if (token.regex) {
                object.regex = token.regex;
            }
            return object;
        },

        createMemberExpression: function (accessor, object, property) {
            return {
                type: Syntax.MemberExpression,
                computed: accessor === '[',
                object: object,
                property: property
            };
        },

        createNewExpression: function (callee, args) {
            return {
                type: Syntax.NewExpression,
                callee: callee,
                'arguments': args
            };
        },

        createObjectExpression: function (properties) {
            return {
                type: Syntax.ObjectExpression,
                properties: properties
            };
        },

        createPostfixExpression: function (operator, argument) {
            return {
                type: Syntax.UpdateExpression,
                operator: operator,
                argument: argument,
                prefix: false
            };
        },

        createProgram: function (body) {
            return {
                type: Syntax.Program,
                body: body
            };
        },

        createProperty: function (kind, key, value, method, shorthand, computed) {
            return {
                type: Syntax.Property,
                key: key,
                value: value,
                kind: kind,
                method: method,
                shorthand: shorthand,
                computed: computed
            };
        },

        createReturnStatement: function (argument) {
            return {
                type: Syntax.ReturnStatement,
                argument: argument
            };
        },

        createSequenceExpression: function (expressions) {
            return {
                type: Syntax.SequenceExpression,
                expressions: expressions
            };
        },

        createSwitchCase: function (test, consequent) {
            return {
                type: Syntax.SwitchCase,
                test: test,
                consequent: consequent
            };
        },

        createSwitchStatement: function (discriminant, cases) {
            return {
                type: Syntax.SwitchStatement,
                discriminant: discriminant,
                cases: cases
            };
        },

        createThisExpression: function () {
            return {
                type: Syntax.ThisExpression
            };
        },

        createThrowStatement: function (argument) {
            return {
                type: Syntax.ThrowStatement,
                argument: argument
            };
        },

        createTryStatement: function (block, guardedHandlers, handlers, finalizer) {
            return {
                type: Syntax.TryStatement,
                block: block,
                guardedHandlers: guardedHandlers,
                handlers: handlers,
                finalizer: finalizer
            };
        },

        createUnaryExpression: function (operator, argument) {
            if (operator === '++' || operator === '--') {
                return {
                    type: Syntax.UpdateExpression,
                    operator: operator,
                    argument: argument,
                    prefix: true
                };
            }
            return {
                type: Syntax.UnaryExpression,
                operator: operator,
                argument: argument,
                prefix: true
            };
        },

        createVariableDeclaration: function (declarations, kind) {
            return {
                type: Syntax.VariableDeclaration,
                declarations: declarations,
                kind: kind
            };
        },

        createVariableDeclarator: function (id, init) {
            return {
                type: Syntax.VariableDeclarator,
                id: id,
                init: init
            };
        },

        createWhileStatement: function (test, body) {
            return {
                type: Syntax.WhileStatement,
                test: test,
                body: body
            };
        },

        createWithStatement: function (object, body) {
            return {
                type: Syntax.WithStatement,
                object: object,
                body: body
            };
        },

        createTemplateElement: function (value, tail) {
            return {
                type: Syntax.TemplateElement,
                value: value,
                tail: tail
            };
        },

        createTemplateLiteral: function (quasis, expressions) {
            return {
                type: Syntax.TemplateLiteral,
                quasis: quasis,
                expressions: expressions
            };
        },

        createSpreadElement: function (argument) {
            return {
                type: Syntax.SpreadElement,
                argument: argument
            };
        },

        createSpreadProperty: function (argument) {
            return {
                type: Syntax.SpreadProperty,
                argument: argument
            };
        },

        createTaggedTemplateExpression: function (tag, quasi) {
            return {
                type: Syntax.TaggedTemplateExpression,
                tag: tag,
                quasi: quasi
            };
        },

        createArrowFunctionExpression: function (params, defaults, body, rest, expression, isAsync) {
            var arrowExpr = {
                type: Syntax.ArrowFunctionExpression,
                id: null,
                params: params,
                defaults: defaults,
                body: body,
                rest: rest,
                generator: false,
                expression: expression
            };

            if (isAsync) {
                arrowExpr.async = true;
            }

            return arrowExpr;
        },

        createMethodDefinition: function (propertyType, kind, key, value) {
            return {
                type: Syntax.MethodDefinition,
                key: key,
                value: value,
                kind: kind,
                'static': propertyType === ClassPropertyType.static
            };
        },

        createClassProperty: function (key, typeAnnotation, computed, isStatic) {
            return {
                type: Syntax.ClassProperty,
                key: key,
                typeAnnotation: typeAnnotation,
                computed: computed,
                static: isStatic
            };
        },

        createClassBody: function (body) {
            return {
                type: Syntax.ClassBody,
                body: body
            };
        },

        createClassImplements: function (id, typeParameters) {
            return {
                type: Syntax.ClassImplements,
                id: id,
                typeParameters: typeParameters
            };
        },

        createClassExpression: function (id, superClass, body, typeParameters, superTypeParameters, implemented) {
            return {
                type: Syntax.ClassExpression,
                id: id,
                superClass: superClass,
                body: body,
                typeParameters: typeParameters,
                superTypeParameters: superTypeParameters,
                implements: implemented
            };
        },

        createClassDeclaration: function (id, superClass, body, typeParameters, superTypeParameters, implemented) {
            return {
                type: Syntax.ClassDeclaration,
                id: id,
                superClass: superClass,
                body: body,
                typeParameters: typeParameters,
                superTypeParameters: superTypeParameters,
                implements: implemented
            };
        },

        createModuleSpecifier: function (token) {
            return {
                type: Syntax.ModuleSpecifier,
                value: token.value,
                raw: source.slice(token.range[0], token.range[1])
            };
        },

        createExportSpecifier: function (id, name) {
            return {
                type: Syntax.ExportSpecifier,
                id: id,
                name: name
            };
        },

        createExportBatchSpecifier: function () {
            return {
                type: Syntax.ExportBatchSpecifier
            };
        },

        createImportDefaultSpecifier: function (id) {
            return {
                type: Syntax.ImportDefaultSpecifier,
                id: id
            };
        },

        createImportNamespaceSpecifier: function (id) {
            return {
                type: Syntax.ImportNamespaceSpecifier,
                id: id
            };
        },

        createExportDeclaration: function (isDefault, declaration, specifiers, source) {
            return {
                type: Syntax.ExportDeclaration,
                'default': !!isDefault,
                declaration: declaration,
                specifiers: specifiers,
                source: source
            };
        },

        createImportSpecifier: function (id, name) {
            return {
                type: Syntax.ImportSpecifier,
                id: id,
                name: name
            };
        },

        createImportDeclaration: function (specifiers, source) {
            return {
                type: Syntax.ImportDeclaration,
                specifiers: specifiers,
                source: source
            };
        },

        createYieldExpression: function (argument, delegate) {
            return {
                type: Syntax.YieldExpression,
                argument: argument,
                delegate: delegate
            };
        },

        createAwaitExpression: function (argument) {
            return {
                type: Syntax.AwaitExpression,
                argument: argument
            };
        },

        createComprehensionExpression: function (filter, blocks, body) {
            return {
                type: Syntax.ComprehensionExpression,
                filter: filter,
                blocks: blocks,
                body: body
            };
        }

    };

    // Return true if there is a line terminator before the next token.

    function peekLineTerminator() {
        var pos, line, start, found;

        pos = index;
        line = lineNumber;
        start = lineStart;
        skipComment();
        found = lineNumber !== line;
        index = pos;
        lineNumber = line;
        lineStart = start;

        return found;
    }

    // Throw an exception

    function throwError(token, messageFormat) {
        var error,
            args = Array.prototype.slice.call(arguments, 2),
            msg = messageFormat.replace(
                /%(\d)/g,
                function (whole, index) {
                    assert(index < args.length, 'Message reference must be in range');
                    return args[index];
                }
            );

        if (typeof token.lineNumber === 'number') {
            error = new Error('Line ' + token.lineNumber + ': ' + msg);
            error.index = token.range[0];
            error.lineNumber = token.lineNumber;
            error.column = token.range[0] - lineStart + 1;
        } else {
            error = new Error('Line ' + lineNumber + ': ' + msg);
            error.index = index;
            error.lineNumber = lineNumber;
            error.column = index - lineStart + 1;
        }

        error.description = msg;
        throw error;
    }

    function throwErrorTolerant() {
        try {
            throwError.apply(null, arguments);
        } catch (e) {
            if (extra.errors) {
                extra.errors.push(e);
            } else {
                throw e;
            }
        }
    }


    // Throw an exception because of the token.

    function throwUnexpected(token) {
        if (token.type === Token.EOF) {
            throwError(token, Messages.UnexpectedEOS);
        }

        if (token.type === Token.NumericLiteral) {
            throwError(token, Messages.UnexpectedNumber);
        }

        if (token.type === Token.StringLiteral || token.type === Token.XJSText) {
            throwError(token, Messages.UnexpectedString);
        }

        if (token.type === Token.Identifier) {
            throwError(token, Messages.UnexpectedIdentifier);
        }

        if (token.type === Token.Keyword) {
            if (isFutureReservedWord(token.value)) {
                throwError(token, Messages.UnexpectedReserved);
            } else if (strict && isStrictModeReservedWord(token.value)) {
                throwErrorTolerant(token, Messages.StrictReservedWord);
                return;
            }
            throwError(token, Messages.UnexpectedToken, token.value);
        }

        if (token.type === Token.Template) {
            throwError(token, Messages.UnexpectedTemplate, token.value.raw);
        }

        // BooleanLiteral, NullLiteral, or Punctuator.
        throwError(token, Messages.UnexpectedToken, token.value);
    }

    // Expect the next token to match the specified punctuator.
    // If not, an exception will be thrown.

    function expect(value) {
        var token = lex();
        if (token.type !== Token.Punctuator || token.value !== value) {
            throwUnexpected(token);
        }
    }

    // Expect the next token to match the specified keyword.
    // If not, an exception will be thrown.

    function expectKeyword(keyword, contextual) {
        var token = lex();
        if (token.type !== (contextual ? Token.Identifier : Token.Keyword) ||
                token.value !== keyword) {
            throwUnexpected(token);
        }
    }

    // Expect the next token to match the specified contextual keyword.
    // If not, an exception will be thrown.

    function expectContextualKeyword(keyword) {
        return expectKeyword(keyword, true);
    }

    // Return true if the next token matches the specified punctuator.

    function match(value) {
        return lookahead.type === Token.Punctuator && lookahead.value === value;
    }

    // Return true if the next token matches the specified keyword

    function matchKeyword(keyword, contextual) {
        var expectedType = contextual ? Token.Identifier : Token.Keyword;
        return lookahead.type === expectedType && lookahead.value === keyword;
    }

    // Return true if the next token matches the specified contextual keyword

    function matchContextualKeyword(keyword) {
        return matchKeyword(keyword, true);
    }

    // Return true if the next token is an assignment operator

    function matchAssign() {
        var op;

        if (lookahead.type !== Token.Punctuator) {
            return false;
        }
        op = lookahead.value;
        return op === '=' ||
            op === '*=' ||
            op === '/=' ||
            op === '%=' ||
            op === '+=' ||
            op === '-=' ||
            op === '<<=' ||
            op === '>>=' ||
            op === '>>>=' ||
            op === '&=' ||
            op === '^=' ||
            op === '|=';
    }

    // Note that 'yield' is treated as a keyword in strict mode, but a
    // contextual keyword (identifier) in non-strict mode, so we need to
    // use matchKeyword('yield', false) and matchKeyword('yield', true)
    // (i.e. matchContextualKeyword) appropriately.
    function matchYield() {
        return state.yieldAllowed && matchKeyword('yield', !strict);
    }

    function matchAsync() {
        var backtrackToken = lookahead, matches = false;

        if (matchContextualKeyword('async')) {
            lex(); // Make sure peekLineTerminator() starts after 'async'.
            matches = !peekLineTerminator();
            rewind(backtrackToken); // Revert the lex().
        }

        return matches;
    }

    function matchAwait() {
        return state.awaitAllowed && matchContextualKeyword('await');
    }

    function consumeSemicolon() {
        var line, oldIndex = index, oldLineNumber = lineNumber,
            oldLineStart = lineStart, oldLookahead = lookahead;

        // Catch the very common case first: immediately a semicolon (char #59).
        if (source.charCodeAt(index) === 59) {
            lex();
            return;
        }

        line = lineNumber;
        skipComment();
        if (lineNumber !== line) {
            index = oldIndex;
            lineNumber = oldLineNumber;
            lineStart = oldLineStart;
            lookahead = oldLookahead;
            return;
        }

        if (match(';')) {
            lex();
            return;
        }

        if (lookahead.type !== Token.EOF && !match('}')) {
            throwUnexpected(lookahead);
        }
    }

    // Return true if provided expression is LeftHandSideExpression

    function isLeftHandSide(expr) {
        return expr.type === Syntax.Identifier || expr.type === Syntax.MemberExpression;
    }

    function isAssignableLeftHandSide(expr) {
        return isLeftHandSide(expr) || expr.type === Syntax.ObjectPattern || expr.type === Syntax.ArrayPattern;
    }

    // 11.1.4 Array Initialiser

    function parseArrayInitialiser() {
        var elements = [], blocks = [], filter = null, tmp, possiblecomprehension = true, body,
            marker = markerCreate();

        expect('[');
        while (!match(']')) {
            if (lookahead.value === 'for' &&
                    lookahead.type === Token.Keyword) {
                if (!possiblecomprehension) {
                    throwError({}, Messages.ComprehensionError);
                }
                matchKeyword('for');
                tmp = parseForStatement({ignoreBody: true});
                tmp.of = tmp.type === Syntax.ForOfStatement;
                tmp.type = Syntax.ComprehensionBlock;
                if (tmp.left.kind) { // can't be let or const
                    throwError({}, Messages.ComprehensionError);
                }
                blocks.push(tmp);
            } else if (lookahead.value === 'if' &&
                           lookahead.type === Token.Keyword) {
                if (!possiblecomprehension) {
                    throwError({}, Messages.ComprehensionError);
                }
                expectKeyword('if');
                expect('(');
                filter = parseExpression();
                expect(')');
            } else if (lookahead.value === ',' &&
                           lookahead.type === Token.Punctuator) {
                possiblecomprehension = false; // no longer allowed.
                lex();
                elements.push(null);
            } else {
                tmp = parseSpreadOrAssignmentExpression();
                elements.push(tmp);
                if (tmp && tmp.type === Syntax.SpreadElement) {
                    if (!match(']')) {
                        throwError({}, Messages.ElementAfterSpreadElement);
                    }
                } else if (!(match(']') || matchKeyword('for') || matchKeyword('if'))) {
                    expect(','); // this lexes.
                    possiblecomprehension = false;
                }
            }
        }

        expect(']');

        if (filter && !blocks.length) {
            throwError({}, Messages.ComprehensionRequiresBlock);
        }

        if (blocks.length) {
            if (elements.length !== 1) {
                throwError({}, Messages.ComprehensionError);
            }
            return markerApply(marker, delegate.createComprehensionExpression(filter, blocks, elements[0]));
        }
        return markerApply(marker, delegate.createArrayExpression(elements));
    }

    // 11.1.5 Object Initialiser

    function parsePropertyFunction(options) {
        var previousStrict, previousYieldAllowed, previousAwaitAllowed,
            params, defaults, body, marker = markerCreate();

        previousStrict = strict;
        previousYieldAllowed = state.yieldAllowed;
        state.yieldAllowed = options.generator;
        previousAwaitAllowed = state.awaitAllowed;
        state.awaitAllowed = options.async;
        params = options.params || [];
        defaults = options.defaults || [];

        body = parseConciseBody();
        if (options.name && strict && isRestrictedWord(params[0].name)) {
            throwErrorTolerant(options.name, Messages.StrictParamName);
        }
        strict = previousStrict;
        state.yieldAllowed = previousYieldAllowed;
        state.awaitAllowed = previousAwaitAllowed;

        return markerApply(marker, delegate.createFunctionExpression(
            null,
            params,
            defaults,
            body,
            options.rest || null,
            options.generator,
            body.type !== Syntax.BlockStatement,
            options.async,
            options.returnType,
            options.typeParameters
        ));
    }


    function parsePropertyMethodFunction(options) {
        var previousStrict, tmp, method;

        previousStrict = strict;
        strict = true;

        tmp = parseParams();

        if (tmp.stricted) {
            throwErrorTolerant(tmp.stricted, tmp.message);
        }

        method = parsePropertyFunction({
            params: tmp.params,
            defaults: tmp.defaults,
            rest: tmp.rest,
            generator: options.generator,
            async: options.async,
            returnType: tmp.returnType,
            typeParameters: options.typeParameters
        });

        strict = previousStrict;

        return method;
    }


    function parseObjectPropertyKey() {
        var marker = markerCreate(),
            token = lex(),
            propertyKey,
            result;

        // Note: This function is called only from parseObjectProperty(), where
        // EOF and Punctuator tokens are already filtered out.

        if (token.type === Token.StringLiteral || token.type === Token.NumericLiteral) {
            if (strict && token.octal) {
                throwErrorTolerant(token, Messages.StrictOctalLiteral);
            }
            return markerApply(marker, delegate.createLiteral(token));
        }

        if (token.type === Token.Punctuator && token.value === '[') {
            // For computed properties we should skip the [ and ], and
            // capture in marker only the assignment expression itself.
            marker = markerCreate();
            propertyKey = parseAssignmentExpression();
            result = markerApply(marker, propertyKey);
            expect(']');
            return result;
        }

        return markerApply(marker, delegate.createIdentifier(token.value));
    }

    function parseObjectProperty() {
        var token, key, id, value, param, expr, computed,
            marker = markerCreate(), returnType;

        token = lookahead;
        computed = (token.value === '[');

        if (token.type === Token.Identifier || computed || matchAsync()) {
            id = parseObjectPropertyKey();

            if (match(':')) {
                lex();

                return markerApply(
                    marker,
                    delegate.createProperty(
                        'init',
                        id,
                        parseAssignmentExpression(),
                        false,
                        false,
                        computed
                    )
                );
            }

            if (match('(')) {
                return markerApply(
                    marker,
                    delegate.createProperty(
                        'init',
                        id,
                        parsePropertyMethodFunction({
                            generator: false,
                            async: false
                        }),
                        true,
                        false,
                        computed
                    )
                );
            }

            // Property Assignment: Getter and Setter.

            if (token.value === 'get') {
                computed = (lookahead.value === '[');
                key = parseObjectPropertyKey();

                expect('(');
                expect(')');
                if (match(':')) {
                    returnType = parseTypeAnnotation();
                }

                return markerApply(
                    marker,
                    delegate.createProperty(
                        'get',
                        key,
                        parsePropertyFunction({
                            generator: false,
                            async: false,
                            returnType: returnType
                        }),
                        false,
                        false,
                        computed
                    )
                );
            }

            if (token.value === 'set') {
                computed = (lookahead.value === '[');
                key = parseObjectPropertyKey();

                expect('(');
                token = lookahead;
                param = [ parseTypeAnnotatableIdentifier() ];
                expect(')');
                if (match(':')) {
                    returnType = parseTypeAnnotation();
                }

                return markerApply(
                    marker,
                    delegate.createProperty(
                        'set',
                        key,
                        parsePropertyFunction({
                            params: param,
                            generator: false,
                            async: false,
                            name: token,
                            returnType: returnType
                        }),
                        false,
                        false,
                        computed
                    )
                );
            }

            if (token.value === 'async') {
                computed = (lookahead.value === '[');
                key = parseObjectPropertyKey();

                return markerApply(
                    marker,
                    delegate.createProperty(
                        'init',
                        key,
                        parsePropertyMethodFunction({
                            generator: false,
                            async: true
                        }),
                        true,
                        false,
                        computed
                    )
                );
            }

            if (computed) {
                // Computed properties can only be used with full notation.
                throwUnexpected(lookahead);
            }

            return markerApply(
                marker,
                delegate.createProperty('init', id, id, false, true, false)
            );
        }

        if (token.type === Token.EOF || token.type === Token.Punctuator) {
            if (!match('*')) {
                throwUnexpected(token);
            }
            lex();

            computed = (lookahead.type === Token.Punctuator && lookahead.value === '[');

            id = parseObjectPropertyKey();

            if (!match('(')) {
                throwUnexpected(lex());
            }

            return markerApply(marker, delegate.createProperty('init', id, parsePropertyMethodFunction({ generator: true }), true, false, computed));
        }
        key = parseObjectPropertyKey();
        if (match(':')) {
            lex();
            return markerApply(marker, delegate.createProperty('init', key, parseAssignmentExpression(), false, false, false));
        }
        if (match('(')) {
            return markerApply(marker, delegate.createProperty('init', key, parsePropertyMethodFunction({ generator: false }), true, false, false));
        }
        throwUnexpected(lex());
    }

    function parseObjectSpreadProperty() {
        var marker = markerCreate();
        expect('...');
        return markerApply(marker, delegate.createSpreadProperty(parseAssignmentExpression()));
    }

    function parseObjectInitialiser() {
        var properties = [], property, name, key, kind, map = {}, toString = String,
            marker = markerCreate();

        expect('{');

        while (!match('}')) {
            if (match('...')) {
                property = parseObjectSpreadProperty();
            } else {
                property = parseObjectProperty();

                if (property.key.type === Syntax.Identifier) {
                    name = property.key.name;
                } else {
                    name = toString(property.key.value);
                }
                kind = (property.kind === 'init') ? PropertyKind.Data : (property.kind === 'get') ? PropertyKind.Get : PropertyKind.Set;

                key = '$' + name;
                if (Object.prototype.hasOwnProperty.call(map, key)) {
                    if (map[key] === PropertyKind.Data) {
                        if (strict && kind === PropertyKind.Data) {
                            throwErrorTolerant({}, Messages.StrictDuplicateProperty);
                        } else if (kind !== PropertyKind.Data) {
                            throwErrorTolerant({}, Messages.AccessorDataProperty);
                        }
                    } else {
                        if (kind === PropertyKind.Data) {
                            throwErrorTolerant({}, Messages.AccessorDataProperty);
                        } else if (map[key] & kind) {
                            throwErrorTolerant({}, Messages.AccessorGetSet);
                        }
                    }
                    map[key] |= kind;
                } else {
                    map[key] = kind;
                }
            }

            properties.push(property);

            if (!match('}')) {
                expect(',');
            }
        }

        expect('}');

        return markerApply(marker, delegate.createObjectExpression(properties));
    }

    function parseTemplateElement(option) {
        var marker = markerCreate(),
            token = scanTemplateElement(option);
        if (strict && token.octal) {
            throwError(token, Messages.StrictOctalLiteral);
        }
        return markerApply(marker, delegate.createTemplateElement({ raw: token.value.raw, cooked: token.value.cooked }, token.tail));
    }

    function parseTemplateLiteral() {
        var quasi, quasis, expressions, marker = markerCreate();

        quasi = parseTemplateElement({ head: true });
        quasis = [ quasi ];
        expressions = [];

        while (!quasi.tail) {
            expressions.push(parseExpression());
            quasi = parseTemplateElement({ head: false });
            quasis.push(quasi);
        }

        return markerApply(marker, delegate.createTemplateLiteral(quasis, expressions));
    }

    // 11.1.6 The Grouping Operator

    function parseGroupExpression() {
        var expr;

        expect('(');

        ++state.parenthesizedCount;

        expr = parseExpression();

        expect(')');

        return expr;
    }

    function matchAsyncFuncExprOrDecl() {
        var token;

        if (matchAsync()) {
            token = lookahead2();
            if (token.type === Token.Keyword && token.value === 'function') {
                return true;
            }
        }

        return false;
    }

    // 11.1 Primary Expressions

    function parsePrimaryExpression() {
        var marker, type, token, expr;

        type = lookahead.type;

        if (type === Token.Identifier) {
            marker = markerCreate();
            return markerApply(marker, delegate.createIdentifier(lex().value));
        }

        if (type === Token.StringLiteral || type === Token.NumericLiteral) {
            if (strict && lookahead.octal) {
                throwErrorTolerant(lookahead, Messages.StrictOctalLiteral);
            }
            marker = markerCreate();
            return markerApply(marker, delegate.createLiteral(lex()));
        }

        if (type === Token.Keyword) {
            if (matchKeyword('this')) {
                marker = markerCreate();
                lex();
                return markerApply(marker, delegate.createThisExpression());
            }

            if (matchKeyword('function')) {
                return parseFunctionExpression();
            }

            if (matchKeyword('class')) {
                return parseClassExpression();
            }

            if (matchKeyword('super')) {
                marker = markerCreate();
                lex();
                return markerApply(marker, delegate.createIdentifier('super'));
            }
        }

        if (type === Token.BooleanLiteral) {
            marker = markerCreate();
            token = lex();
            token.value = (token.value === 'true');
            return markerApply(marker, delegate.createLiteral(token));
        }

        if (type === Token.NullLiteral) {
            marker = markerCreate();
            token = lex();
            token.value = null;
            return markerApply(marker, delegate.createLiteral(token));
        }

        if (match('[')) {
            return parseArrayInitialiser();
        }

        if (match('{')) {
            return parseObjectInitialiser();
        }

        if (match('(')) {
            return parseGroupExpression();
        }

        if (match('/') || match('/=')) {
            marker = markerCreate();
            return markerApply(marker, delegate.createLiteral(scanRegExp()));
        }

        if (type === Token.Template) {
            return parseTemplateLiteral();
        }

        if (match('<')) {
            return parseXJSElement();
        }

        throwUnexpected(lex());
    }

    // 11.2 Left-Hand-Side Expressions

    function parseArguments() {
        var args = [], arg;

        expect('(');

        if (!match(')')) {
            while (index < length) {
                arg = parseSpreadOrAssignmentExpression();
                args.push(arg);

                if (match(')')) {
                    break;
                } else if (arg.type === Syntax.SpreadElement) {
                    throwError({}, Messages.ElementAfterSpreadElement);
                }

                expect(',');
            }
        }

        expect(')');

        return args;
    }

    function parseSpreadOrAssignmentExpression() {
        if (match('...')) {
            var marker = markerCreate();
            lex();
            return markerApply(marker, delegate.createSpreadElement(parseAssignmentExpression()));
        }
        return parseAssignmentExpression();
    }

    function parseNonComputedProperty() {
        var marker = markerCreate(),
            token = lex();

        if (!isIdentifierName(token)) {
            throwUnexpected(token);
        }

        return markerApply(marker, delegate.createIdentifier(token.value));
    }

    function parseNonComputedMember() {
        expect('.');

        return parseNonComputedProperty();
    }

    function parseComputedMember() {
        var expr;

        expect('[');

        expr = parseExpression();

        expect(']');

        return expr;
    }

    function parseNewExpression() {
        var callee, args, marker = markerCreate();

        expectKeyword('new');
        callee = parseLeftHandSideExpression();
        args = match('(') ? parseArguments() : [];

        return markerApply(marker, delegate.createNewExpression(callee, args));
    }

    function parseLeftHandSideExpressionAllowCall() {
        var expr, args, marker = markerCreate();

        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        while (match('.') || match('[') || match('(') || lookahead.type === Token.Template) {
            if (match('(')) {
                args = parseArguments();
                expr = markerApply(marker, delegate.createCallExpression(expr, args));
            } else if (match('[')) {
                expr = markerApply(marker, delegate.createMemberExpression('[', expr, parseComputedMember()));
            } else if (match('.')) {
                expr = markerApply(marker, delegate.createMemberExpression('.', expr, parseNonComputedMember()));
            } else {
                expr = markerApply(marker, delegate.createTaggedTemplateExpression(expr, parseTemplateLiteral()));
            }
        }

        return expr;
    }

    function parseLeftHandSideExpression() {
        var expr, marker = markerCreate();

        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        while (match('.') || match('[') || lookahead.type === Token.Template) {
            if (match('[')) {
                expr = markerApply(marker, delegate.createMemberExpression('[', expr, parseComputedMember()));
            } else if (match('.')) {
                expr = markerApply(marker, delegate.createMemberExpression('.', expr, parseNonComputedMember()));
            } else {
                expr = markerApply(marker, delegate.createTaggedTemplateExpression(expr, parseTemplateLiteral()));
            }
        }

        return expr;
    }

    // 11.3 Postfix Expressions

    function parsePostfixExpression() {
        var marker = markerCreate(),
            expr = parseLeftHandSideExpressionAllowCall(),
            token;

        if (lookahead.type !== Token.Punctuator) {
            return expr;
        }

        if ((match('++') || match('--')) && !peekLineTerminator()) {
            // 11.3.1, 11.3.2
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant({}, Messages.StrictLHSPostfix);
            }

            if (!isLeftHandSide(expr)) {
                throwError({}, Messages.InvalidLHSInAssignment);
            }

            token = lex();
            expr = markerApply(marker, delegate.createPostfixExpression(token.value, expr));
        }

        return expr;
    }

    // 11.4 Unary Operators

    function parseUnaryExpression() {
        var marker, token, expr;

        if (lookahead.type !== Token.Punctuator && lookahead.type !== Token.Keyword) {
            return parsePostfixExpression();
        }

        if (match('++') || match('--')) {
            marker = markerCreate();
            token = lex();
            expr = parseUnaryExpression();
            // 11.4.4, 11.4.5
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant({}, Messages.StrictLHSPrefix);
            }

            if (!isLeftHandSide(expr)) {
                throwError({}, Messages.InvalidLHSInAssignment);
            }

            return markerApply(marker, delegate.createUnaryExpression(token.value, expr));
        }

        if (match('+') || match('-') || match('~') || match('!')) {
            marker = markerCreate();
            token = lex();
            expr = parseUnaryExpression();
            return markerApply(marker, delegate.createUnaryExpression(token.value, expr));
        }

        if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
            marker = markerCreate();
            token = lex();
            expr = parseUnaryExpression();
            expr = markerApply(marker, delegate.createUnaryExpression(token.value, expr));
            if (strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                throwErrorTolerant({}, Messages.StrictDelete);
            }
            return expr;
        }

        return parsePostfixExpression();
    }

    function binaryPrecedence(token, allowIn) {
        var prec = 0;

        if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
            return 0;
        }

        switch (token.value) {
        case '||':
            prec = 1;
            break;

        case '&&':
            prec = 2;
            break;

        case '|':
            prec = 3;
            break;

        case '^':
            prec = 4;
            break;

        case '&':
            prec = 5;
            break;

        case '==':
        case '!=':
        case '===':
        case '!==':
            prec = 6;
            break;

        case '<':
        case '>':
        case '<=':
        case '>=':
        case 'instanceof':
            prec = 7;
            break;

        case 'in':
            prec = allowIn ? 7 : 0;
            break;

        case '<<':
        case '>>':
        case '>>>':
            prec = 8;
            break;

        case '+':
        case '-':
            prec = 9;
            break;

        case '*':
        case '/':
        case '%':
            prec = 11;
            break;

        default:
            break;
        }

        return prec;
    }

    // 11.5 Multiplicative Operators
    // 11.6 Additive Operators
    // 11.7 Bitwise Shift Operators
    // 11.8 Relational Operators
    // 11.9 Equality Operators
    // 11.10 Binary Bitwise Operators
    // 11.11 Binary Logical Operators

    function parseBinaryExpression() {
        var expr, token, prec, previousAllowIn, stack, right, operator, left, i,
            marker, markers;

        previousAllowIn = state.allowIn;
        state.allowIn = true;

        marker = markerCreate();
        left = parseUnaryExpression();

        token = lookahead;
        prec = binaryPrecedence(token, previousAllowIn);
        if (prec === 0) {
            return left;
        }
        token.prec = prec;
        lex();

        markers = [marker, markerCreate()];
        right = parseUnaryExpression();

        stack = [left, token, right];

        while ((prec = binaryPrecedence(lookahead, previousAllowIn)) > 0) {

            // Reduce: make a binary expression from the three topmost entries.
            while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
                right = stack.pop();
                operator = stack.pop().value;
                left = stack.pop();
                expr = delegate.createBinaryExpression(operator, left, right);
                markers.pop();
                marker = markers.pop();
                markerApply(marker, expr);
                stack.push(expr);
                markers.push(marker);
            }

            // Shift.
            token = lex();
            token.prec = prec;
            stack.push(token);
            markers.push(markerCreate());
            expr = parseUnaryExpression();
            stack.push(expr);
        }

        state.allowIn = previousAllowIn;

        // Final reduce to clean-up the stack.
        i = stack.length - 1;
        expr = stack[i];
        markers.pop();
        while (i > 1) {
            expr = delegate.createBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
            i -= 2;
            marker = markers.pop();
            markerApply(marker, expr);
        }

        return expr;
    }


    // 11.12 Conditional Operator

    function parseConditionalExpression() {
        var expr, previousAllowIn, consequent, alternate, marker = markerCreate();
        expr = parseBinaryExpression();

        if (match('?')) {
            lex();
            previousAllowIn = state.allowIn;
            state.allowIn = true;
            consequent = parseAssignmentExpression();
            state.allowIn = previousAllowIn;
            expect(':');
            alternate = parseAssignmentExpression();

            expr = markerApply(marker, delegate.createConditionalExpression(expr, consequent, alternate));
        }

        return expr;
    }

    // 11.13 Assignment Operators

    function reinterpretAsAssignmentBindingPattern(expr) {
        var i, len, property, element;

        if (expr.type === Syntax.ObjectExpression) {
            expr.type = Syntax.ObjectPattern;
            for (i = 0, len = expr.properties.length; i < len; i += 1) {
                property = expr.properties[i];
                if (property.type === Syntax.SpreadProperty) {
                    if (i < len - 1) {
                        throwError({}, Messages.PropertyAfterSpreadProperty);
                    }
                    reinterpretAsAssignmentBindingPattern(property.argument);
                } else {
                    if (property.kind !== 'init') {
                        throwError({}, Messages.InvalidLHSInAssignment);
                    }
                    reinterpretAsAssignmentBindingPattern(property.value);
                }
            }
        } else if (expr.type === Syntax.ArrayExpression) {
            expr.type = Syntax.ArrayPattern;
            for (i = 0, len = expr.elements.length; i < len; i += 1) {
                element = expr.elements[i];
                if (element) {
                    reinterpretAsAssignmentBindingPattern(element);
                }
            }
        } else if (expr.type === Syntax.Identifier) {
            if (isRestrictedWord(expr.name)) {
                throwError({}, Messages.InvalidLHSInAssignment);
            }
        } else if (expr.type === Syntax.SpreadElement) {
            reinterpretAsAssignmentBindingPattern(expr.argument);
            if (expr.argument.type === Syntax.ObjectPattern) {
                throwError({}, Messages.ObjectPatternAsSpread);
            }
        } else {
            if (expr.type !== Syntax.MemberExpression && expr.type !== Syntax.CallExpression && expr.type !== Syntax.NewExpression) {
                throwError({}, Messages.InvalidLHSInAssignment);
            }
        }
    }


    function reinterpretAsDestructuredParameter(options, expr) {
        var i, len, property, element;

        if (expr.type === Syntax.ObjectExpression) {
            expr.type = Syntax.ObjectPattern;
            for (i = 0, len = expr.properties.length; i < len; i += 1) {
                property = expr.properties[i];
                if (property.type === Syntax.SpreadProperty) {
                    if (i < len - 1) {
                        throwError({}, Messages.PropertyAfterSpreadProperty);
                    }
                    reinterpretAsDestructuredParameter(options, property.argument);
                } else {
                    if (property.kind !== 'init') {
                        throwError({}, Messages.InvalidLHSInFormalsList);
                    }
                    reinterpretAsDestructuredParameter(options, property.value);
                }
            }
        } else if (expr.type === Syntax.ArrayExpression) {
            expr.type = Syntax.ArrayPattern;
            for (i = 0, len = expr.elements.length; i < len; i += 1) {
                element = expr.elements[i];
                if (element) {
                    reinterpretAsDestructuredParameter(options, element);
                }
            }
        } else if (expr.type === Syntax.Identifier) {
            validateParam(options, expr, expr.name);
        } else {
            if (expr.type !== Syntax.MemberExpression) {
                throwError({}, Messages.InvalidLHSInFormalsList);
            }
        }
    }

    function reinterpretAsCoverFormalsList(expressions) {
        var i, len, param, params, defaults, defaultCount, options, rest;

        params = [];
        defaults = [];
        defaultCount = 0;
        rest = null;
        options = {
            paramSet: {}
        };

        for (i = 0, len = expressions.length; i < len; i += 1) {
            param = expressions[i];
            if (param.type === Syntax.Identifier) {
                params.push(param);
                defaults.push(null);
                validateParam(options, param, param.name);
            } else if (param.type === Syntax.ObjectExpression || param.type === Syntax.ArrayExpression) {
                reinterpretAsDestructuredParameter(options, param);
                params.push(param);
                defaults.push(null);
            } else if (param.type === Syntax.SpreadElement) {
                assert(i === len - 1, 'It is guaranteed that SpreadElement is last element by parseExpression');
                reinterpretAsDestructuredParameter(options, param.argument);
                rest = param.argument;
            } else if (param.type === Syntax.AssignmentExpression) {
                params.push(param.left);
                defaults.push(param.right);
                ++defaultCount;
                validateParam(options, param.left, param.left.name);
            } else {
                return null;
            }
        }

        if (options.message === Messages.StrictParamDupe) {
            throwError(
                strict ? options.stricted : options.firstRestricted,
                options.message
            );
        }

        if (defaultCount === 0) {
            defaults = [];
        }

        return {
            params: params,
            defaults: defaults,
            rest: rest,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }

    function parseArrowFunctionExpression(options, marker) {
        var previousStrict, previousYieldAllowed, previousAwaitAllowed, body;

        expect('=>');

        previousStrict = strict;
        previousYieldAllowed = state.yieldAllowed;
        state.yieldAllowed = false;
        previousAwaitAllowed = state.awaitAllowed;
        state.awaitAllowed = !!options.async;
        body = parseConciseBody();

        if (strict && options.firstRestricted) {
            throwError(options.firstRestricted, options.message);
        }
        if (strict && options.stricted) {
            throwErrorTolerant(options.stricted, options.message);
        }

        strict = previousStrict;
        state.yieldAllowed = previousYieldAllowed;
        state.awaitAllowed = previousAwaitAllowed;

        return markerApply(marker, delegate.createArrowFunctionExpression(
            options.params,
            options.defaults,
            body,
            options.rest,
            body.type !== Syntax.BlockStatement,
            !!options.async
        ));
    }

    function parseAssignmentExpression() {
        var marker, expr, token, params, oldParenthesizedCount,
            backtrackToken = lookahead, possiblyAsync = false;

        if (matchYield()) {
            return parseYieldExpression();
        }

        if (matchAwait()) {
            return parseAwaitExpression();
        }

        oldParenthesizedCount = state.parenthesizedCount;

        marker = markerCreate();

        if (matchAsyncFuncExprOrDecl()) {
            return parseFunctionExpression();
        }

        if (matchAsync()) {
            // We can't be completely sure that this 'async' token is
            // actually a contextual keyword modifying a function
            // expression, so we might have to un-lex() it later by
            // calling rewind(backtrackToken).
            possiblyAsync = true;
            lex();
        }

        if (match('(')) {
            token = lookahead2();
            if ((token.type === Token.Punctuator && token.value === ')') || token.value === '...') {
                params = parseParams();
                if (!match('=>')) {
                    throwUnexpected(lex());
                }
                params.async = possiblyAsync;
                return parseArrowFunctionExpression(params, marker);
            }
        }

        token = lookahead;

        // If the 'async' keyword is not followed by a '(' character or an
        // identifier, then it can't be an arrow function modifier, and we
        // should interpret it as a normal identifer.
        if (possiblyAsync && !match('(') && token.type !== Token.Identifier) {
            possiblyAsync = false;
            rewind(backtrackToken);
        }

        expr = parseConditionalExpression();

        if (match('=>') &&
                (state.parenthesizedCount === oldParenthesizedCount ||
                state.parenthesizedCount === (oldParenthesizedCount + 1))) {
            if (expr.type === Syntax.Identifier) {
                params = reinterpretAsCoverFormalsList([ expr ]);
            } else if (expr.type === Syntax.SequenceExpression) {
                params = reinterpretAsCoverFormalsList(expr.expressions);
            }
            if (params) {
                params.async = possiblyAsync;
                return parseArrowFunctionExpression(params, marker);
            }
        }

        // If we haven't returned by now, then the 'async' keyword was not
        // a function modifier, and we should rewind and interpret it as a
        // normal identifier.
        if (possiblyAsync) {
            possiblyAsync = false;
            rewind(backtrackToken);
            expr = parseConditionalExpression();
        }

        if (matchAssign()) {
            // 11.13.1
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant(token, Messages.StrictLHSAssignment);
            }

            // ES.next draf 11.13 Runtime Semantics step 1
            if (match('=') && (expr.type === Syntax.ObjectExpression || expr.type === Syntax.ArrayExpression)) {
                reinterpretAsAssignmentBindingPattern(expr);
            } else if (!isLeftHandSide(expr)) {
                throwError({}, Messages.InvalidLHSInAssignment);
            }

            expr = markerApply(marker, delegate.createAssignmentExpression(lex().value, expr, parseAssignmentExpression()));
        }

        return expr;
    }

    // 11.14 Comma Operator

    function parseExpression() {
        var marker, expr, expressions, sequence, coverFormalsList, spreadFound, oldParenthesizedCount;

        oldParenthesizedCount = state.parenthesizedCount;

        marker = markerCreate();
        expr = parseAssignmentExpression();
        expressions = [ expr ];

        if (match(',')) {
            while (index < length) {
                if (!match(',')) {
                    break;
                }

                lex();
                expr = parseSpreadOrAssignmentExpression();
                expressions.push(expr);

                if (expr.type === Syntax.SpreadElement) {
                    spreadFound = true;
                    if (!match(')')) {
                        throwError({}, Messages.ElementAfterSpreadElement);
                    }
                    break;
                }
            }

            sequence = markerApply(marker, delegate.createSequenceExpression(expressions));
        }

        if (match('=>')) {
            // Do not allow nested parentheses on the LHS of the =>.
            if (state.parenthesizedCount === oldParenthesizedCount || state.parenthesizedCount === (oldParenthesizedCount + 1)) {
                expr = expr.type === Syntax.SequenceExpression ? expr.expressions : expressions;
                coverFormalsList = reinterpretAsCoverFormalsList(expr);
                if (coverFormalsList) {
                    return parseArrowFunctionExpression(coverFormalsList, marker);
                }
            }
            throwUnexpected(lex());
        }

        if (spreadFound && lookahead2().value !== '=>') {
            throwError({}, Messages.IllegalSpread);
        }

        return sequence || expr;
    }

    // 12.1 Block

    function parseStatementList() {
        var list = [],
            statement;

        while (index < length) {
            if (match('}')) {
                break;
            }
            statement = parseSourceElement();
            if (typeof statement === 'undefined') {
                break;
            }
            list.push(statement);
        }

        return list;
    }

    function parseBlock() {
        var block, marker = markerCreate();

        expect('{');

        block = parseStatementList();

        expect('}');

        return markerApply(marker, delegate.createBlockStatement(block));
    }

    // 12.2 Variable Statement

    function parseTypeParameterDeclaration() {
        var marker = markerCreate(), paramTypes = [];

        expect('<');
        while (!match('>')) {
            paramTypes.push(parseVariableIdentifier());
            if (!match('>')) {
                expect(',');
            }
        }
        expect('>');

        return markerApply(marker, delegate.createTypeParameterDeclaration(
            paramTypes
        ));
    }

    function parseTypeParameterInstantiation() {
        var marker = markerCreate(), oldInType = state.inType, paramTypes = [];

        state.inType = true;

        expect('<');
        while (!match('>')) {
            paramTypes.push(parseType());
            if (!match('>')) {
                expect(',');
            }
        }
        expect('>');

        state.inType = oldInType;

        return markerApply(marker, delegate.createTypeParameterInstantiation(
            paramTypes
        ));
    }

    function parseObjectTypeIndexer(marker, isStatic) {
        var id, key, value;

        expect('[');
        id = parseObjectPropertyKey();
        expect(':');
        key = parseType();
        expect(']');
        expect(':');
        value = parseType();

        return markerApply(marker, delegate.createObjectTypeIndexer(
            id,
            key,
            value,
            isStatic
        ));
    }

    function parseObjectTypeMethodish(marker) {
        var params = [], rest = null, returnType, typeParameters = null;
        if (match('<')) {
            typeParameters = parseTypeParameterDeclaration();
        }

        expect('(');
        while (lookahead.type === Token.Identifier) {
            params.push(parseFunctionTypeParam());
            if (!match(')')) {
                expect(',');
            }
        }

        if (match('...')) {
            lex();
            rest = parseFunctionTypeParam();
        }
        expect(')');
        expect(':');
        returnType = parseType();

        return markerApply(marker, delegate.createFunctionTypeAnnotation(
            params,
            returnType,
            rest,
            typeParameters
        ));
    }

    function parseObjectTypeMethod(marker, isStatic, key) {
        var optional = false, value;
        value = parseObjectTypeMethodish(marker);

        return markerApply(marker, delegate.createObjectTypeProperty(
            key,
            value,
            optional,
            isStatic
        ));
    }

    function parseObjectTypeCallProperty(marker, isStatic) {
        var valueMarker = markerCreate();
        return markerApply(marker, delegate.createObjectTypeCallProperty(
            parseObjectTypeMethodish(valueMarker),
            isStatic
        ));
    }

    function parseObjectType(allowStatic) {
        var callProperties = [], indexers = [], marker, optional = false,
            properties = [], property, propertyKey, propertyTypeAnnotation,
            token, isStatic;

        expect('{');

        while (!match('}')) {
            marker = markerCreate();
            if (allowStatic && matchContextualKeyword('static')) {
                token = lex();
                isStatic = true;
            }

            if (match('[')) {
                indexers.push(parseObjectTypeIndexer(marker, isStatic));
            } else if (match('(') || match('<')) {
                callProperties.push(parseObjectTypeCallProperty(marker, allowStatic));
            } else {
                if (isStatic && match(':')) {
                    propertyKey = markerApply(marker, delegate.createIdentifier(token));
                    throwErrorTolerant(token, Messages.StrictReservedWord);
                } else {
                    propertyKey = parseObjectPropertyKey();
                }
                if (match('<') || match('(')) {
                    // This is a method property
                    properties.push(parseObjectTypeMethod(marker, isStatic, propertyKey));
                } else {
                    if (match('?')) {
                        lex();
                        optional = true;
                    }
                    expect(':');
                    propertyTypeAnnotation = parseType();
                    properties.push(markerApply(marker, delegate.createObjectTypeProperty(
                        propertyKey,
                        propertyTypeAnnotation,
                        optional,
                        isStatic
                    )));
                }
            }

            if (match(';')) {
                lex();
            } else if (!match('}')) {
                throwUnexpected(lookahead);
            }
        }

        expect('}');

        return delegate.createObjectTypeAnnotation(
            properties,
            indexers,
            callProperties
        );
    }

    function parseGenericType() {
        var marker = markerCreate(), returnType = null,
            typeParameters = null, typeIdentifier,
            typeIdentifierMarker = markerCreate;

        typeIdentifier = parseVariableIdentifier();

        while (match('.')) {
            expect('.');
            typeIdentifier = markerApply(marker, delegate.createQualifiedTypeIdentifier(
                typeIdentifier,
                parseVariableIdentifier()
            ));
        }

        if (match('<')) {
            typeParameters = parseTypeParameterInstantiation();
        }

        return markerApply(marker, delegate.createGenericTypeAnnotation(
            typeIdentifier,
            typeParameters
        ));
    }

    function parseVoidType() {
        var marker = markerCreate();
        expectKeyword('void');
        return markerApply(marker, delegate.createVoidTypeAnnotation());
    }

    function parseTypeofType() {
        var argument, marker = markerCreate();
        expectKeyword('typeof');
        argument = parsePrimaryType();
        return markerApply(marker, delegate.createTypeofTypeAnnotation(
            argument
        ));
    }

    function parseTupleType() {
        var marker = markerCreate(), types = [];
        expect('[');
        // We allow trailing commas
        while (index < length && !match(']')) {
            types.push(parseType());
            if (match(']')) {
                break;
            }
            expect(',');
        }
        expect(']');
        return markerApply(marker, delegate.createTupleTypeAnnotation(
            types
        ));
    }

    function parseFunctionTypeParam() {
        var marker = markerCreate(), name, optional = false, typeAnnotation;
        name = parseVariableIdentifier();
        if (match('?')) {
            lex();
            optional = true;
        }
        expect(':');
        typeAnnotation = parseType();
        return markerApply(marker, delegate.createFunctionTypeParam(
            name,
            typeAnnotation,
            optional
        ));
    }

    function parseFunctionTypeParams() {
        var ret = { params: [], rest: null };
        while (lookahead.type === Token.Identifier) {
            ret.params.push(parseFunctionTypeParam());
            if (!match(')')) {
                expect(',');
            }
        }

        if (match('...')) {
            lex();
            ret.rest = parseFunctionTypeParam();
        }
        return ret;
    }

    // The parsing of types roughly parallels the parsing of expressions, and
    // primary types are kind of like primary expressions...they're the
    // primitives with which other types are constructed.
    function parsePrimaryType() {
        var typeIdentifier = null, params = null, returnType = null,
            marker = markerCreate(), rest = null, tmp,
            typeParameters, token, type, isGroupedType = false;

        switch (lookahead.type) {
        case Token.Identifier:
            switch (lookahead.value) {
            case 'any':
                lex();
                return markerApply(marker, delegate.createAnyTypeAnnotation());
            case 'bool':  // fallthrough
            case 'boolean':
                lex();
                return markerApply(marker, delegate.createBooleanTypeAnnotation());
            case 'number':
                lex();
                return markerApply(marker, delegate.createNumberTypeAnnotation());
            case 'string':
                lex();
                return markerApply(marker, delegate.createStringTypeAnnotation());
            }
            return markerApply(marker, parseGenericType());
        case Token.Punctuator:
            switch (lookahead.value) {
            case '{':
                return markerApply(marker, parseObjectType());
            case '[':
                return parseTupleType();
            case '<':
                typeParameters = parseTypeParameterDeclaration();
                expect('(');
                tmp = parseFunctionTypeParams();
                params = tmp.params;
                rest = tmp.rest;
                expect(')');

                expect('=>');

                returnType = parseType();

                return markerApply(marker, delegate.createFunctionTypeAnnotation(
                    params,
                    returnType,
                    rest,
                    typeParameters
                ));
            case '(':
                lex();
                // Check to see if this is actually a grouped type
                if (!match(')') && !match('...')) {
                    if (lookahead.type === Token.Identifier) {
                        token = lookahead2();
                        isGroupedType = token.value !== '?' && token.value !== ':';
                    } else {
                        isGroupedType = true;
                    }
                }

                if (isGroupedType) {
                    type = parseType();
                    expect(')');

                    // If we see a => next then someone was probably confused about
                    // function types, so we can provide a better error message
                    if (match('=>')) {
                        throwError({}, Messages.ConfusedAboutFunctionType);
                    }

                    return type;
                }

                tmp = parseFunctionTypeParams();
                params = tmp.params;
                rest = tmp.rest;

                expect(')');

                expect('=>');

                returnType = parseType();

                return markerApply(marker, delegate.createFunctionTypeAnnotation(
                    params,
                    returnType,
                    rest,
                    null /* typeParameters */
                ));
            }
            break;
        case Token.Keyword:
            switch (lookahead.value) {
            case 'void':
                return markerApply(marker, parseVoidType());
            case 'typeof':
                return markerApply(marker, parseTypeofType());
            }
            break;
        case Token.StringLiteral:
            token = lex();
            if (token.octal) {
                throwError(token, Messages.StrictOctalLiteral);
            }
            return markerApply(marker, delegate.createStringLiteralTypeAnnotation(
                token
            ));
        }

        throwUnexpected(lookahead);
    }

    function parsePostfixType() {
        var marker = markerCreate(), t = parsePrimaryType();
        if (match('[')) {
            expect('[');
            expect(']');
            return markerApply(marker, delegate.createArrayTypeAnnotation(t));
        }
        return t;
    }

    function parsePrefixType() {
        var marker = markerCreate();
        if (match('?')) {
            lex();
            return markerApply(marker, delegate.createNullableTypeAnnotation(
                parsePrefixType()
            ));
        }
        return parsePostfixType();
    }


    function parseIntersectionType() {
        var marker = markerCreate(), type, types;
        type = parsePrefixType();
        types = [type];
        while (match('&')) {
            lex();
            types.push(parsePrefixType());
        }

        return types.length === 1 ?
                type :
                markerApply(marker, delegate.createIntersectionTypeAnnotation(
                    types
                ));
    }

    function parseUnionType() {
        var marker = markerCreate(), type, types;
        type = parseIntersectionType();
        types = [type];
        while (match('|')) {
            lex();
            types.push(parseIntersectionType());
        }
        return types.length === 1 ?
                type :
                markerApply(marker, delegate.createUnionTypeAnnotation(
                    types
                ));
    }

    function parseType() {
        var oldInType = state.inType, type;
        state.inType = true;

        type = parseUnionType();

        state.inType = oldInType;
        return type;
    }

    function parseTypeAnnotation() {
        var marker = markerCreate(), type;

        expect(':');
        type = parseType();

        return markerApply(marker, delegate.createTypeAnnotation(type));
    }

    function parseVariableIdentifier() {
        var marker = markerCreate(),
            token = lex();

        if (token.type !== Token.Identifier) {
            throwUnexpected(token);
        }

        return markerApply(marker, delegate.createIdentifier(token.value));
    }

    function parseTypeAnnotatableIdentifier(requireTypeAnnotation, canBeOptionalParam) {
        var marker = markerCreate(),
            ident = parseVariableIdentifier(),
            isOptionalParam = false;

        if (canBeOptionalParam && match('?')) {
            expect('?');
            isOptionalParam = true;
        }

        if (requireTypeAnnotation || match(':')) {
            ident.typeAnnotation = parseTypeAnnotation();
            ident = markerApply(marker, ident);
        }

        if (isOptionalParam) {
            ident.optional = true;
            ident = markerApply(marker, ident);
        }

        return ident;
    }

    function parseVariableDeclaration(kind) {
        var id,
            marker = markerCreate(),
            init = null,
            typeAnnotationMarker = markerCreate();
        if (match('{')) {
            id = parseObjectInitialiser();
            reinterpretAsAssignmentBindingPattern(id);
            if (match(':')) {
                id.typeAnnotation = parseTypeAnnotation();
                markerApply(typeAnnotationMarker, id);
            }
        } else if (match('[')) {
            id = parseArrayInitialiser();
            reinterpretAsAssignmentBindingPattern(id);
            if (match(':')) {
                id.typeAnnotation = parseTypeAnnotation();
                markerApply(typeAnnotationMarker, id);
            }
        } else {
            id = state.allowKeyword ? parseNonComputedProperty() : parseTypeAnnotatableIdentifier();
            // 12.2.1
            if (strict && isRestrictedWord(id.name)) {
                throwErrorTolerant({}, Messages.StrictVarName);
            }
        }

        if (kind === 'const') {
            if (!match('=')) {
                throwError({}, Messages.NoUnintializedConst);
            }
            expect('=');
            init = parseAssignmentExpression();
        } else if (match('=')) {
            lex();
            init = parseAssignmentExpression();
        }

        return markerApply(marker, delegate.createVariableDeclarator(id, init));
    }

    function parseVariableDeclarationList(kind) {
        var list = [];

        do {
            list.push(parseVariableDeclaration(kind));
            if (!match(',')) {
                break;
            }
            lex();
        } while (index < length);

        return list;
    }

    function parseVariableStatement() {
        var declarations, marker = markerCreate();

        expectKeyword('var');

        declarations = parseVariableDeclarationList();

        consumeSemicolon();

        return markerApply(marker, delegate.createVariableDeclaration(declarations, 'var'));
    }

    // kind may be `const` or `let`
    // Both are experimental and not in the specification yet.
    // see http://wiki.ecmascript.org/doku.php?id=harmony:const
    // and http://wiki.ecmascript.org/doku.php?id=harmony:let
    function parseConstLetDeclaration(kind) {
        var declarations, marker = markerCreate();

        expectKeyword(kind);

        declarations = parseVariableDeclarationList(kind);

        consumeSemicolon();

        return markerApply(marker, delegate.createVariableDeclaration(declarations, kind));
    }

    // people.mozilla.org/~jorendorff/es6-draft.html

    function parseModuleSpecifier() {
        var marker = markerCreate(),
            specifier;

        if (lookahead.type !== Token.StringLiteral) {
            throwError({}, Messages.InvalidModuleSpecifier);
        }
        specifier = delegate.createModuleSpecifier(lookahead);
        lex();
        return markerApply(marker, specifier);
    }

    function parseExportBatchSpecifier() {
        var marker = markerCreate();
        expect('*');
        return markerApply(marker, delegate.createExportBatchSpecifier());
    }

    function parseExportSpecifier() {
        var id, name = null, marker = markerCreate(), from;
        if (matchKeyword('default')) {
            lex();
            id = markerApply(marker, delegate.createIdentifier('default'));
            // export {default} from "something";
        } else {
            id = parseVariableIdentifier();
        }
        if (matchContextualKeyword('as')) {
            lex();
            name = parseNonComputedProperty();
        }

        return markerApply(marker, delegate.createExportSpecifier(id, name));
    }

    function parseExportDeclaration() {
        var backtrackToken, id, previousAllowKeyword, declaration = null,
            isExportFromIdentifier,
            src = null, specifiers = [],
            marker = markerCreate();

        expectKeyword('export');

        if (matchKeyword('default')) {
            // covers:
            // export default ...
            lex();
            if (matchKeyword('function') || matchKeyword('class')) {
                backtrackToken = lookahead;
                lex();
                if (isIdentifierName(lookahead)) {
                    // covers:
                    // export default function foo () {}
                    // export default class foo {}
                    id = parseNonComputedProperty();
                    rewind(backtrackToken);
                    return markerApply(marker, delegate.createExportDeclaration(true, parseSourceElement(), [id], null));
                }
                // covers:
                // export default function () {}
                // export default class {}
                rewind(backtrackToken);
                switch (lookahead.value) {
                case 'class':
                    return markerApply(marker, delegate.createExportDeclaration(true, parseClassExpression(), [], null));
                case 'function':
                    return markerApply(marker, delegate.createExportDeclaration(true, parseFunctionExpression(), [], null));
                }
            }

            if (matchContextualKeyword('from')) {
                throwError({}, Messages.UnexpectedToken, lookahead.value);
            }

            // covers:
            // export default {};
            // export default [];
            if (match('{')) {
                declaration = parseObjectInitialiser();
            } else if (match('[')) {
                declaration = parseArrayInitialiser();
            } else {
                declaration = parseAssignmentExpression();
            }
            consumeSemicolon();
            return markerApply(marker, delegate.createExportDeclaration(true, declaration, [], null));
        }

        // non-default export
        if (lookahead.type === Token.Keyword) {
            // covers:
            // export var f = 1;
            switch (lookahead.value) {
            case 'let':
            case 'const':
            case 'var':
            case 'class':
            case 'function':
                return markerApply(marker, delegate.createExportDeclaration(false, parseSourceElement(), specifiers, null));
            }
        }

        if (match('*')) {
            // covers:
            // export * from "foo";
            specifiers.push(parseExportBatchSpecifier());

            if (!matchContextualKeyword('from')) {
                throwError({}, lookahead.value ?
                        Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
            }
            lex();
            src = parseModuleSpecifier();
            consumeSemicolon();

            return markerApply(marker, delegate.createExportDeclaration(false, null, specifiers, src));
        }

        expect('{');
        do {
            isExportFromIdentifier = isExportFromIdentifier || matchKeyword('default');
            specifiers.push(parseExportSpecifier());
        } while (match(',') && lex());
        expect('}');

        if (matchContextualKeyword('from')) {
            // covering:
            // export {default} from "foo";
            // export {foo} from "foo";
            lex();
            src = parseModuleSpecifier();
            consumeSemicolon();
        } else if (isExportFromIdentifier) {
            // covering:
            // export {default}; // missing fromClause
            throwError({}, lookahead.value ?
                    Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
        } else {
            // cover
            // export {foo};
            consumeSemicolon();
        }
        return markerApply(marker, delegate.createExportDeclaration(false, declaration, specifiers, src));
    }


    function parseImportSpecifier() {
        // import {<foo as bar>} ...;
        var id, name = null, marker = markerCreate();

        id = parseNonComputedProperty();
        if (matchContextualKeyword('as')) {
            lex();
            name = parseVariableIdentifier();
        }

        return markerApply(marker, delegate.createImportSpecifier(id, name));
    }

    function parseNamedImports() {
        var specifiers = [];
        // {foo, bar as bas}
        expect('{');
        do {
            specifiers.push(parseImportSpecifier());
        } while (match(',') && lex());
        expect('}');
        return specifiers;
    }

    function parseImportDefaultSpecifier() {
        // import <foo> ...;
        var id, marker = markerCreate();

        id = parseNonComputedProperty();

        return markerApply(marker, delegate.createImportDefaultSpecifier(id));
    }

    function parseImportNamespaceSpecifier() {
        // import <* as foo> ...;
        var id, marker = markerCreate();

        expect('*');
        if (!matchContextualKeyword('as')) {
            throwError({}, Messages.NoAsAfterImportNamespace);
        }
        lex();
        id = parseNonComputedProperty();

        return markerApply(marker, delegate.createImportNamespaceSpecifier(id));
    }

    function parseImportDeclaration() {
        var specifiers, src, marker = markerCreate();

        expectKeyword('import');
        specifiers = [];

        if (lookahead.type === Token.StringLiteral) {
            // covers:
            // import "foo";
            src = parseModuleSpecifier();
            consumeSemicolon();
            return markerApply(marker, delegate.createImportDeclaration(specifiers, src));
        }

        if (!matchKeyword('default') && isIdentifierName(lookahead)) {
            // covers:
            // import foo
            // import foo, ...
            specifiers.push(parseImportDefaultSpecifier());
            if (match(',')) {
                lex();
            }
        }
        if (match('*')) {
            // covers:
            // import foo, * as foo
            // import * as foo
            specifiers.push(parseImportNamespaceSpecifier());
        } else if (match('{')) {
            // covers:
            // import foo, {bar}
            // import {bar}
            specifiers = specifiers.concat(parseNamedImports());
        }

        if (!matchContextualKeyword('from')) {
            throwError({}, lookahead.value ?
                    Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
        }
        lex();
        src = parseModuleSpecifier();
        consumeSemicolon();

        return markerApply(marker, delegate.createImportDeclaration(specifiers, src));
    }

    // 12.3 Empty Statement

    function parseEmptyStatement() {
        var marker = markerCreate();
        expect(';');
        return markerApply(marker, delegate.createEmptyStatement());
    }

    // 12.4 Expression Statement

    function parseExpressionStatement() {
        var marker = markerCreate(), expr = parseExpression();
        consumeSemicolon();
        return markerApply(marker, delegate.createExpressionStatement(expr));
    }

    // 12.5 If statement

    function parseIfStatement() {
        var test, consequent, alternate, marker = markerCreate();

        expectKeyword('if');

        expect('(');

        test = parseExpression();

        expect(')');

        consequent = parseStatement();

        if (matchKeyword('else')) {
            lex();
            alternate = parseStatement();
        } else {
            alternate = null;
        }

        return markerApply(marker, delegate.createIfStatement(test, consequent, alternate));
    }

    // 12.6 Iteration Statements

    function parseDoWhileStatement() {
        var body, test, oldInIteration, marker = markerCreate();

        expectKeyword('do');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        if (match(';')) {
            lex();
        }

        return markerApply(marker, delegate.createDoWhileStatement(body, test));
    }

    function parseWhileStatement() {
        var test, body, oldInIteration, marker = markerCreate();

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        return markerApply(marker, delegate.createWhileStatement(test, body));
    }

    function parseForVariableDeclaration() {
        var marker = markerCreate(),
            token = lex(),
            declarations = parseVariableDeclarationList();

        return markerApply(marker, delegate.createVariableDeclaration(declarations, token.value));
    }

    function parseForStatement(opts) {
        var init, test, update, left, right, body, operator, oldInIteration,
            marker = markerCreate();
        init = test = update = null;
        expectKeyword('for');

        // http://wiki.ecmascript.org/doku.php?id=proposals:iterators_and_generators&s=each
        if (matchContextualKeyword('each')) {
            throwError({}, Messages.EachNotAllowed);
        }

        expect('(');

        if (match(';')) {
            lex();
        } else {
            if (matchKeyword('var') || matchKeyword('let') || matchKeyword('const')) {
                state.allowIn = false;
                init = parseForVariableDeclaration();
                state.allowIn = true;

                if (init.declarations.length === 1) {
                    if (matchKeyword('in') || matchContextualKeyword('of')) {
                        operator = lookahead;
                        if (!((operator.value === 'in' || init.kind !== 'var') && init.declarations[0].init)) {
                            lex();
                            left = init;
                            right = parseExpression();
                            init = null;
                        }
                    }
                }
            } else {
                state.allowIn = false;
                init = parseExpression();
                state.allowIn = true;

                if (matchContextualKeyword('of')) {
                    operator = lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (matchKeyword('in')) {
                    // LeftHandSideExpression
                    if (!isAssignableLeftHandSide(init)) {
                        throwError({}, Messages.InvalidLHSInForIn);
                    }
                    operator = lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                }
            }

            if (typeof left === 'undefined') {
                expect(';');
            }
        }

        if (typeof left === 'undefined') {

            if (!match(';')) {
                test = parseExpression();
            }
            expect(';');

            if (!match(')')) {
                update = parseExpression();
            }
        }

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        if (!(opts !== undefined && opts.ignoreBody)) {
            body = parseStatement();
        }

        state.inIteration = oldInIteration;

        if (typeof left === 'undefined') {
            return markerApply(marker, delegate.createForStatement(init, test, update, body));
        }

        if (operator.value === 'in') {
            return markerApply(marker, delegate.createForInStatement(left, right, body));
        }
        return markerApply(marker, delegate.createForOfStatement(left, right, body));
    }

    // 12.7 The continue statement

    function parseContinueStatement() {
        var label = null, key, marker = markerCreate();

        expectKeyword('continue');

        // Optimize the most common form: 'continue;'.
        if (source.charCodeAt(index) === 59) {
            lex();

            if (!state.inIteration) {
                throwError({}, Messages.IllegalContinue);
            }

            return markerApply(marker, delegate.createContinueStatement(null));
        }

        if (peekLineTerminator()) {
            if (!state.inIteration) {
                throwError({}, Messages.IllegalContinue);
            }

            return markerApply(marker, delegate.createContinueStatement(null));
        }

        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError({}, Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !state.inIteration) {
            throwError({}, Messages.IllegalContinue);
        }

        return markerApply(marker, delegate.createContinueStatement(label));
    }

    // 12.8 The break statement

    function parseBreakStatement() {
        var label = null, key, marker = markerCreate();

        expectKeyword('break');

        // Catch the very common case first: immediately a semicolon (char #59).
        if (source.charCodeAt(index) === 59) {
            lex();

            if (!(state.inIteration || state.inSwitch)) {
                throwError({}, Messages.IllegalBreak);
            }

            return markerApply(marker, delegate.createBreakStatement(null));
        }

        if (peekLineTerminator()) {
            if (!(state.inIteration || state.inSwitch)) {
                throwError({}, Messages.IllegalBreak);
            }

            return markerApply(marker, delegate.createBreakStatement(null));
        }

        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError({}, Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !(state.inIteration || state.inSwitch)) {
            throwError({}, Messages.IllegalBreak);
        }

        return markerApply(marker, delegate.createBreakStatement(label));
    }

    // 12.9 The return statement

    function parseReturnStatement() {
        var argument = null, marker = markerCreate();

        expectKeyword('return');

        if (!state.inFunctionBody) {
            throwErrorTolerant({}, Messages.IllegalReturn);
        }

        // 'return' followed by a space and an identifier is very common.
        if (source.charCodeAt(index) === 32) {
            if (isIdentifierStart(source.charCodeAt(index + 1))) {
                argument = parseExpression();
                consumeSemicolon();
                return markerApply(marker, delegate.createReturnStatement(argument));
            }
        }

        if (peekLineTerminator()) {
            return markerApply(marker, delegate.createReturnStatement(null));
        }

        if (!match(';')) {
            if (!match('}') && lookahead.type !== Token.EOF) {
                argument = parseExpression();
            }
        }

        consumeSemicolon();

        return markerApply(marker, delegate.createReturnStatement(argument));
    }

    // 12.10 The with statement

    function parseWithStatement() {
        var object, body, marker = markerCreate();

        if (strict) {
            throwErrorTolerant({}, Messages.StrictModeWith);
        }

        expectKeyword('with');

        expect('(');

        object = parseExpression();

        expect(')');

        body = parseStatement();

        return markerApply(marker, delegate.createWithStatement(object, body));
    }

    // 12.10 The swith statement

    function parseSwitchCase() {
        var test,
            consequent = [],
            sourceElement,
            marker = markerCreate();

        if (matchKeyword('default')) {
            lex();
            test = null;
        } else {
            expectKeyword('case');
            test = parseExpression();
        }
        expect(':');

        while (index < length) {
            if (match('}') || matchKeyword('default') || matchKeyword('case')) {
                break;
            }
            sourceElement = parseSourceElement();
            if (typeof sourceElement === 'undefined') {
                break;
            }
            consequent.push(sourceElement);
        }

        return markerApply(marker, delegate.createSwitchCase(test, consequent));
    }

    function parseSwitchStatement() {
        var discriminant, cases, clause, oldInSwitch, defaultFound, marker = markerCreate();

        expectKeyword('switch');

        expect('(');

        discriminant = parseExpression();

        expect(')');

        expect('{');

        cases = [];

        if (match('}')) {
            lex();
            return markerApply(marker, delegate.createSwitchStatement(discriminant, cases));
        }

        oldInSwitch = state.inSwitch;
        state.inSwitch = true;
        defaultFound = false;

        while (index < length) {
            if (match('}')) {
                break;
            }
            clause = parseSwitchCase();
            if (clause.test === null) {
                if (defaultFound) {
                    throwError({}, Messages.MultipleDefaultsInSwitch);
                }
                defaultFound = true;
            }
            cases.push(clause);
        }

        state.inSwitch = oldInSwitch;

        expect('}');

        return markerApply(marker, delegate.createSwitchStatement(discriminant, cases));
    }

    // 12.13 The throw statement

    function parseThrowStatement() {
        var argument, marker = markerCreate();

        expectKeyword('throw');

        if (peekLineTerminator()) {
            throwError({}, Messages.NewlineAfterThrow);
        }

        argument = parseExpression();

        consumeSemicolon();

        return markerApply(marker, delegate.createThrowStatement(argument));
    }

    // 12.14 The try statement

    function parseCatchClause() {
        var param, body, marker = markerCreate();

        expectKeyword('catch');

        expect('(');
        if (match(')')) {
            throwUnexpected(lookahead);
        }

        param = parseExpression();
        // 12.14.1
        if (strict && param.type === Syntax.Identifier && isRestrictedWord(param.name)) {
            throwErrorTolerant({}, Messages.StrictCatchVariable);
        }

        expect(')');
        body = parseBlock();
        return markerApply(marker, delegate.createCatchClause(param, body));
    }

    function parseTryStatement() {
        var block, handlers = [], finalizer = null, marker = markerCreate();

        expectKeyword('try');

        block = parseBlock();

        if (matchKeyword('catch')) {
            handlers.push(parseCatchClause());
        }

        if (matchKeyword('finally')) {
            lex();
            finalizer = parseBlock();
        }

        if (handlers.length === 0 && !finalizer) {
            throwError({}, Messages.NoCatchOrFinally);
        }

        return markerApply(marker, delegate.createTryStatement(block, [], handlers, finalizer));
    }

    // 12.15 The debugger statement

    function parseDebuggerStatement() {
        var marker = markerCreate();
        expectKeyword('debugger');

        consumeSemicolon();

        return markerApply(marker, delegate.createDebuggerStatement());
    }

    // 12 Statements

    function parseStatement() {
        var type = lookahead.type,
            marker,
            expr,
            labeledBody,
            key;

        if (type === Token.EOF) {
            throwUnexpected(lookahead);
        }

        if (type === Token.Punctuator) {
            switch (lookahead.value) {
            case ';':
                return parseEmptyStatement();
            case '{':
                return parseBlock();
            case '(':
                return parseExpressionStatement();
            default:
                break;
            }
        }

        if (type === Token.Keyword) {
            switch (lookahead.value) {
            case 'break':
                return parseBreakStatement();
            case 'continue':
                return parseContinueStatement();
            case 'debugger':
                return parseDebuggerStatement();
            case 'do':
                return parseDoWhileStatement();
            case 'for':
                return parseForStatement();
            case 'function':
                return parseFunctionDeclaration();
            case 'class':
                return parseClassDeclaration();
            case 'if':
                return parseIfStatement();
            case 'return':
                return parseReturnStatement();
            case 'switch':
                return parseSwitchStatement();
            case 'throw':
                return parseThrowStatement();
            case 'try':
                return parseTryStatement();
            case 'var':
                return parseVariableStatement();
            case 'while':
                return parseWhileStatement();
            case 'with':
                return parseWithStatement();
            default:
                break;
            }
        }

        if (matchAsyncFuncExprOrDecl()) {
            return parseFunctionDeclaration();
        }

        marker = markerCreate();
        expr = parseExpression();

        // 12.12 Labelled Statements
        if ((expr.type === Syntax.Identifier) && match(':')) {
            lex();

            key = '$' + expr.name;
            if (Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError({}, Messages.Redeclaration, 'Label', expr.name);
            }

            state.labelSet[key] = true;
            labeledBody = parseStatement();
            delete state.labelSet[key];
            return markerApply(marker, delegate.createLabeledStatement(expr, labeledBody));
        }

        consumeSemicolon();

        return markerApply(marker, delegate.createExpressionStatement(expr));
    }

    // 13 Function Definition

    function parseConciseBody() {
        if (match('{')) {
            return parseFunctionSourceElements();
        }
        return parseAssignmentExpression();
    }

    function parseFunctionSourceElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted,
            oldLabelSet, oldInIteration, oldInSwitch, oldInFunctionBody, oldParenthesizedCount,
            marker = markerCreate();

        expect('{');

        while (index < length) {
            if (lookahead.type !== Token.StringLiteral) {
                break;
            }
            token = lookahead;

            sourceElement = parseSourceElement();
            sourceElements.push(sourceElement);
            if (sourceElement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.range[0] + 1, token.range[1] - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        oldLabelSet = state.labelSet;
        oldInIteration = state.inIteration;
        oldInSwitch = state.inSwitch;
        oldInFunctionBody = state.inFunctionBody;
        oldParenthesizedCount = state.parenthesizedCount;

        state.labelSet = {};
        state.inIteration = false;
        state.inSwitch = false;
        state.inFunctionBody = true;
        state.parenthesizedCount = 0;

        while (index < length) {
            if (match('}')) {
                break;
            }
            sourceElement = parseSourceElement();
            if (typeof sourceElement === 'undefined') {
                break;
            }
            sourceElements.push(sourceElement);
        }

        expect('}');

        state.labelSet = oldLabelSet;
        state.inIteration = oldInIteration;
        state.inSwitch = oldInSwitch;
        state.inFunctionBody = oldInFunctionBody;
        state.parenthesizedCount = oldParenthesizedCount;

        return markerApply(marker, delegate.createBlockStatement(sourceElements));
    }

    function validateParam(options, param, name) {
        var key = '$' + name;
        if (strict) {
            if (isRestrictedWord(name)) {
                options.stricted = param;
                options.message = Messages.StrictParamName;
            }
            if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
            }
        } else if (!options.firstRestricted) {
            if (isRestrictedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictParamName;
            } else if (isStrictModeReservedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictReservedWord;
            } else if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.firstRestricted = param;
                options.message = Messages.StrictParamDupe;
            }
        }
        options.paramSet[key] = true;
    }

    function parseParam(options) {
        var marker, token, rest, param, def;

        token = lookahead;
        if (token.value === '...') {
            token = lex();
            rest = true;
        }

        if (match('[')) {
            marker = markerCreate();
            param = parseArrayInitialiser();
            reinterpretAsDestructuredParameter(options, param);
            if (match(':')) {
                param.typeAnnotation = parseTypeAnnotation();
                markerApply(marker, param);
            }
        } else if (match('{')) {
            marker = markerCreate();
            if (rest) {
                throwError({}, Messages.ObjectPatternAsRestParameter);
            }
            param = parseObjectInitialiser();
            reinterpretAsDestructuredParameter(options, param);
            if (match(':')) {
                param.typeAnnotation = parseTypeAnnotation();
                markerApply(marker, param);
            }
        } else {
            param =
                rest
                ? parseTypeAnnotatableIdentifier(
                    false, /* requireTypeAnnotation */
                    false /* canBeOptionalParam */
                )
                : parseTypeAnnotatableIdentifier(
                    false, /* requireTypeAnnotation */
                    true /* canBeOptionalParam */
                );

            validateParam(options, token, token.value);
        }

        if (match('=')) {
            if (rest) {
                throwErrorTolerant(lookahead, Messages.DefaultRestParameter);
            }
            lex();
            def = parseAssignmentExpression();
            ++options.defaultCount;
        }

        if (rest) {
            if (!match(')')) {
                throwError({}, Messages.ParameterAfterRestParameter);
            }
            options.rest = param;
            return false;
        }

        options.params.push(param);
        options.defaults.push(def);
        return !match(')');
    }

    function parseParams(firstRestricted) {
        var options, marker = markerCreate();

        options = {
            params: [],
            defaultCount: 0,
            defaults: [],
            rest: null,
            firstRestricted: firstRestricted
        };

        expect('(');

        if (!match(')')) {
            options.paramSet = {};
            while (index < length) {
                if (!parseParam(options)) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        if (options.defaultCount === 0) {
            options.defaults = [];
        }

        if (match(':')) {
            options.returnType = parseTypeAnnotation();
        }

        return markerApply(marker, options);
    }

    function parseFunctionDeclaration() {
        var id, body, token, tmp, firstRestricted, message, generator, isAsync,
            previousStrict, previousYieldAllowed, previousAwaitAllowed,
            marker = markerCreate(), typeParameters;

        isAsync = false;
        if (matchAsync()) {
            lex();
            isAsync = true;
        }

        expectKeyword('function');

        generator = false;
        if (match('*')) {
            lex();
            generator = true;
        }

        token = lookahead;

        id = parseVariableIdentifier();

        if (match('<')) {
            typeParameters = parseTypeParameterDeclaration();
        }

        if (strict) {
            if (isRestrictedWord(token.value)) {
                throwErrorTolerant(token, Messages.StrictFunctionName);
            }
        } else {
            if (isRestrictedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictFunctionName;
            } else if (isStrictModeReservedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictReservedWord;
            }
        }

        tmp = parseParams(firstRestricted);
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }

        previousStrict = strict;
        previousYieldAllowed = state.yieldAllowed;
        state.yieldAllowed = generator;
        previousAwaitAllowed = state.awaitAllowed;
        state.awaitAllowed = isAsync;

        body = parseFunctionSourceElements();

        if (strict && firstRestricted) {
            throwError(firstRestricted, message);
        }
        if (strict && tmp.stricted) {
            throwErrorTolerant(tmp.stricted, message);
        }
        strict = previousStrict;
        state.yieldAllowed = previousYieldAllowed;
        state.awaitAllowed = previousAwaitAllowed;

        return markerApply(
            marker,
            delegate.createFunctionDeclaration(
                id,
                tmp.params,
                tmp.defaults,
                body,
                tmp.rest,
                generator,
                false,
                isAsync,
                tmp.returnType,
                typeParameters
            )
        );
    }

    function parseFunctionExpression() {
        var token, id = null, firstRestricted, message, tmp, body, generator, isAsync,
            previousStrict, previousYieldAllowed, previousAwaitAllowed,
            marker = markerCreate(), typeParameters;

        isAsync = false;
        if (matchAsync()) {
            lex();
            isAsync = true;
        }

        expectKeyword('function');

        generator = false;

        if (match('*')) {
            lex();
            generator = true;
        }

        if (!match('(')) {
            if (!match('<')) {
                token = lookahead;
                id = parseVariableIdentifier();

                if (strict) {
                    if (isRestrictedWord(token.value)) {
                        throwErrorTolerant(token, Messages.StrictFunctionName);
                    }
                } else {
                    if (isRestrictedWord(token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictFunctionName;
                    } else if (isStrictModeReservedWord(token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictReservedWord;
                    }
                }
            }

            if (match('<')) {
                typeParameters = parseTypeParameterDeclaration();
            }
        }

        tmp = parseParams(firstRestricted);
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }

        previousStrict = strict;
        previousYieldAllowed = state.yieldAllowed;
        state.yieldAllowed = generator;
        previousAwaitAllowed = state.awaitAllowed;
        state.awaitAllowed = isAsync;

        body = parseFunctionSourceElements();

        if (strict && firstRestricted) {
            throwError(firstRestricted, message);
        }
        if (strict && tmp.stricted) {
            throwErrorTolerant(tmp.stricted, message);
        }
        strict = previousStrict;
        state.yieldAllowed = previousYieldAllowed;
        state.awaitAllowed = previousAwaitAllowed;

        return markerApply(
            marker,
            delegate.createFunctionExpression(
                id,
                tmp.params,
                tmp.defaults,
                body,
                tmp.rest,
                generator,
                false,
                isAsync,
                tmp.returnType,
                typeParameters
            )
        );
    }

    function parseYieldExpression() {
        var delegateFlag, expr, marker = markerCreate();

        expectKeyword('yield', !strict);

        delegateFlag = false;
        if (match('*')) {
            lex();
            delegateFlag = true;
        }

        expr = parseAssignmentExpression();

        return markerApply(marker, delegate.createYieldExpression(expr, delegateFlag));
    }

    function parseAwaitExpression() {
        var expr, marker = markerCreate();
        expectContextualKeyword('await');
        expr = parseAssignmentExpression();
        return markerApply(marker, delegate.createAwaitExpression(expr));
    }

    // 14 Classes

    function parseMethodDefinition(existingPropNames, key, isStatic, generator, computed) {
        var token, param, propType, isValidDuplicateProp = false,
            isAsync, typeParameters, tokenValue, returnType,
            annotationMarker;

        propType = isStatic ? ClassPropertyType.static : ClassPropertyType.prototype;

        if (generator) {
            return delegate.createMethodDefinition(
                propType,
                '',
                key,
                parsePropertyMethodFunction({ generator: true })
            );
        }

        tokenValue = key.type === 'Identifier' && key.name;

        if (tokenValue === 'get' && !match('(')) {
            key = parseObjectPropertyKey();

            // It is a syntax error if any other properties have a name
            // duplicating this one unless they are a setter
            if (existingPropNames[propType].hasOwnProperty(key.name)) {
                isValidDuplicateProp =
                    // There isn't already a getter for this prop
                    existingPropNames[propType][key.name].get === undefined
                    // There isn't already a data prop by this name
                    && existingPropNames[propType][key.name].data === undefined
                    // The only existing prop by this name is a setter
                    && existingPropNames[propType][key.name].set !== undefined;
                if (!isValidDuplicateProp) {
                    throwError(key, Messages.IllegalDuplicateClassProperty);
                }
            } else {
                existingPropNames[propType][key.name] = {};
            }
            existingPropNames[propType][key.name].get = true;

            expect('(');
            expect(')');
            if (match(':')) {
                returnType = parseTypeAnnotation();
            }
            return delegate.createMethodDefinition(
                propType,
                'get',
                key,
                parsePropertyFunction({ generator: false, returnType: returnType })
            );
        }
        if (tokenValue === 'set' && !match('(')) {
            key = parseObjectPropertyKey();

            // It is a syntax error if any other properties have a name
            // duplicating this one unless they are a getter
            if (existingPropNames[propType].hasOwnProperty(key.name)) {
                isValidDuplicateProp =
                    // There isn't already a setter for this prop
                    existingPropNames[propType][key.name].set === undefined
                    // There isn't already a data prop by this name
                    && existingPropNames[propType][key.name].data === undefined
                    // The only existing prop by this name is a getter
                    && existingPropNames[propType][key.name].get !== undefined;
                if (!isValidDuplicateProp) {
                    throwError(key, Messages.IllegalDuplicateClassProperty);
                }
            } else {
                existingPropNames[propType][key.name] = {};
            }
            existingPropNames[propType][key.name].set = true;

            expect('(');
            token = lookahead;
            param = [ parseTypeAnnotatableIdentifier() ];
            expect(')');
            if (match(':')) {
                returnType = parseTypeAnnotation();
            }
            return delegate.createMethodDefinition(
                propType,
                'set',
                key,
                parsePropertyFunction({
                    params: param,
                    generator: false,
                    name: token,
                    returnType: returnType
                })
            );
        }

        if (match('<')) {
            typeParameters = parseTypeParameterDeclaration();
        }

        isAsync = tokenValue === 'async' && !match('(');
        if (isAsync) {
            key = parseObjectPropertyKey();
        }

        // It is a syntax error if any other properties have the same name as a
        // non-getter, non-setter method
        if (existingPropNames[propType].hasOwnProperty(key.name)) {
            throwError(key, Messages.IllegalDuplicateClassProperty);
        } else {
            existingPropNames[propType][key.name] = {};
        }
        existingPropNames[propType][key.name].data = true;

        return delegate.createMethodDefinition(
            propType,
            '',
            key,
            parsePropertyMethodFunction({
                generator: false,
                async: isAsync,
                typeParameters: typeParameters
            })
        );
    }

    function parseClassProperty(existingPropNames, key, computed, isStatic) {
        var typeAnnotation;

        typeAnnotation = parseTypeAnnotation();
        expect(';');

        return delegate.createClassProperty(
            key,
            typeAnnotation,
            computed,
            isStatic
        );
    }

    function parseClassElement(existingProps) {
        var computed, generator = false, key, marker = markerCreate(),
            isStatic = false;
        if (match(';')) {
            lex();
            return;
        }

        if (lookahead.value === 'static') {
            lex();
            isStatic = true;
        }

        if (match('*')) {
            lex();
            generator = true;
        }

        computed = (lookahead.value === '[');
        key = parseObjectPropertyKey();

        if (!generator && lookahead.value === ':') {
            return markerApply(marker, parseClassProperty(existingProps, key, computed, isStatic));
        }

        return markerApply(marker, parseMethodDefinition(
            existingProps,
            key,
            isStatic,
            generator,
            computed
        ));
    }

    function parseClassBody() {
        var classElement, classElements = [], existingProps = {}, marker = markerCreate();

        existingProps[ClassPropertyType.static] = {};
        existingProps[ClassPropertyType.prototype] = {};

        expect('{');

        while (index < length) {
            if (match('}')) {
                break;
            }
            classElement = parseClassElement(existingProps);

            if (typeof classElement !== 'undefined') {
                classElements.push(classElement);
            }
        }

        expect('}');

        return markerApply(marker, delegate.createClassBody(classElements));
    }

    function parseClassImplements() {
        var id, implemented = [], marker, typeParameters;
        expectContextualKeyword('implements');
        while (index < length) {
            marker = markerCreate();
            id = parseVariableIdentifier();
            if (match('<')) {
                typeParameters = parseTypeParameterInstantiation();
            } else {
                typeParameters = null;
            }
            implemented.push(markerApply(marker, delegate.createClassImplements(
                id,
                typeParameters
            )));
            if (!match(',')) {
                break;
            }
            expect(',');
        }
        return implemented;
    }

    function parseClassExpression() {
        var id, implemented, previousYieldAllowed, superClass = null,
            superTypeParameters, marker = markerCreate(), typeParameters;

        expectKeyword('class');

        if (!matchKeyword('extends') && !matchContextualKeyword('implements') && !match('{')) {
            id = parseVariableIdentifier();
        }

        if (match('<')) {
            typeParameters = parseTypeParameterDeclaration();
        }

        if (matchKeyword('extends')) {
            expectKeyword('extends');
            previousYieldAllowed = state.yieldAllowed;
            state.yieldAllowed = false;
            superClass = parseLeftHandSideExpressionAllowCall();
            if (match('<')) {
                superTypeParameters = parseTypeParameterInstantiation();
            }
            state.yieldAllowed = previousYieldAllowed;
        }

        if (matchContextualKeyword('implements')) {
            implemented = parseClassImplements();
        }

        return markerApply(marker, delegate.createClassExpression(
            id,
            superClass,
            parseClassBody(),
            typeParameters,
            superTypeParameters,
            implemented
        ));
    }

    function parseClassDeclaration() {
        var id, implemented, previousYieldAllowed, superClass = null,
            superTypeParameters, marker = markerCreate(), typeParameters;

        expectKeyword('class');

        id = parseVariableIdentifier();

        if (match('<')) {
            typeParameters = parseTypeParameterDeclaration();
        }

        if (matchKeyword('extends')) {
            expectKeyword('extends');
            previousYieldAllowed = state.yieldAllowed;
            state.yieldAllowed = false;
            superClass = parseLeftHandSideExpressionAllowCall();
            if (match('<')) {
                superTypeParameters = parseTypeParameterInstantiation();
            }
            state.yieldAllowed = previousYieldAllowed;
        }

        if (matchContextualKeyword('implements')) {
            implemented = parseClassImplements();
        }

        return markerApply(marker, delegate.createClassDeclaration(
            id,
            superClass,
            parseClassBody(),
            typeParameters,
            superTypeParameters,
            implemented
        ));
    }

    // 15 Program

    function parseSourceElement() {
        var token;
        if (lookahead.type === Token.Keyword) {
            switch (lookahead.value) {
            case 'const':
            case 'let':
                return parseConstLetDeclaration(lookahead.value);
            case 'function':
                return parseFunctionDeclaration();
            default:
                return parseStatement();
            }
        }

        if (matchContextualKeyword('type')
                && lookahead2().type === Token.Identifier) {
            return parseTypeAlias();
        }

        if (matchContextualKeyword('interface')
                && lookahead2().type === Token.Identifier) {
            return parseInterface();
        }

        if (matchContextualKeyword('declare')) {
            token = lookahead2();
            if (token.type === Token.Keyword) {
                switch (token.value) {
                case 'class':
                    return parseDeclareClass();
                case 'function':
                    return parseDeclareFunction();
                case 'var':
                    return parseDeclareVariable();
                }
            } else if (token.type === Token.Identifier
                    && token.value === 'module') {
                return parseDeclareModule();
            }
        }

        if (lookahead.type !== Token.EOF) {
            return parseStatement();
        }
    }

    function parseProgramElement() {
        if (lookahead.type === Token.Keyword) {
            switch (lookahead.value) {
            case 'export':
                return parseExportDeclaration();
            case 'import':
                return parseImportDeclaration();
            }
        }

        return parseSourceElement();
    }

    function parseProgramElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted;

        while (index < length) {
            token = lookahead;
            if (token.type !== Token.StringLiteral) {
                break;
            }

            sourceElement = parseProgramElement();
            sourceElements.push(sourceElement);
            if (sourceElement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.range[0] + 1, token.range[1] - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        while (index < length) {
            sourceElement = parseProgramElement();
            if (typeof sourceElement === 'undefined') {
                break;
            }
            sourceElements.push(sourceElement);
        }
        return sourceElements;
    }

    function parseProgram() {
        var body, marker = markerCreate();
        strict = false;
        peek();
        body = parseProgramElements();
        return markerApply(marker, delegate.createProgram(body));
    }

    // The following functions are needed only when the option to preserve
    // the comments is active.

    function addComment(type, value, start, end, loc) {
        var comment;

        assert(typeof start === 'number', 'Comment must have valid position');

        // Because the way the actual token is scanned, often the comments
        // (if any) are skipped twice during the lexical analysis.
        // Thus, we need to skip adding a comment if the comment array already
        // handled it.
        if (state.lastCommentStart >= start) {
            return;
        }
        state.lastCommentStart = start;

        comment = {
            type: type,
            value: value
        };
        if (extra.range) {
            comment.range = [start, end];
        }
        if (extra.loc) {
            comment.loc = loc;
        }
        extra.comments.push(comment);
        if (extra.attachComment) {
            extra.leadingComments.push(comment);
            extra.trailingComments.push(comment);
        }
    }

    function scanComment() {
        var comment, ch, loc, start, blockComment, lineComment;

        comment = '';
        blockComment = false;
        lineComment = false;

        while (index < length) {
            ch = source[index];

            if (lineComment) {
                ch = source[index++];
                if (isLineTerminator(ch.charCodeAt(0))) {
                    loc.end = {
                        line: lineNumber,
                        column: index - lineStart - 1
                    };
                    lineComment = false;
                    addComment('Line', comment, start, index - 1, loc);
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    ++lineNumber;
                    lineStart = index;
                    comment = '';
                } else if (index >= length) {
                    lineComment = false;
                    comment += ch;
                    loc.end = {
                        line: lineNumber,
                        column: length - lineStart
                    };
                    addComment('Line', comment, start, length, loc);
                } else {
                    comment += ch;
                }
            } else if (blockComment) {
                if (isLineTerminator(ch.charCodeAt(0))) {
                    if (ch === '\r') {
                        ++index;
                        comment += '\r';
                    }
                    if (ch !== '\r' || source[index] === '\n') {
                        comment += source[index];
                        ++lineNumber;
                        ++index;
                        lineStart = index;
                        if (index >= length) {
                            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                        }
                    }
                } else {
                    ch = source[index++];
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                    comment += ch;
                    if (ch === '*') {
                        ch = source[index];
                        if (ch === '/') {
                            comment = comment.substr(0, comment.length - 1);
                            blockComment = false;
                            ++index;
                            loc.end = {
                                line: lineNumber,
                                column: index - lineStart
                            };
                            addComment('Block', comment, start, index, loc);
                            comment = '';
                        }
                    }
                }
            } else if (ch === '/') {
                ch = source[index + 1];
                if (ch === '/') {
                    loc = {
                        start: {
                            line: lineNumber,
                            column: index - lineStart
                        }
                    };
                    start = index;
                    index += 2;
                    lineComment = true;
                    if (index >= length) {
                        loc.end = {
                            line: lineNumber,
                            column: index - lineStart
                        };
                        lineComment = false;
                        addComment('Line', comment, start, index, loc);
                    }
                } else if (ch === '*') {
                    start = index;
                    index += 2;
                    blockComment = true;
                    loc = {
                        start: {
                            line: lineNumber,
                            column: index - lineStart - 2
                        }
                    };
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                } else {
                    break;
                }
            } else if (isWhiteSpace(ch.charCodeAt(0))) {
                ++index;
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                ++index;
                if (ch ===  '\r' && source[index] === '\n') {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
            } else {
                break;
            }
        }
    }

    // 16 XJS

    XHTMLEntities = {
        quot: '\u0022',
        amp: '&',
        apos: '\u0027',
        lt: '<',
        gt: '>',
        nbsp: '\u00A0',
        iexcl: '\u00A1',
        cent: '\u00A2',
        pound: '\u00A3',
        curren: '\u00A4',
        yen: '\u00A5',
        brvbar: '\u00A6',
        sect: '\u00A7',
        uml: '\u00A8',
        copy: '\u00A9',
        ordf: '\u00AA',
        laquo: '\u00AB',
        not: '\u00AC',
        shy: '\u00AD',
        reg: '\u00AE',
        macr: '\u00AF',
        deg: '\u00B0',
        plusmn: '\u00B1',
        sup2: '\u00B2',
        sup3: '\u00B3',
        acute: '\u00B4',
        micro: '\u00B5',
        para: '\u00B6',
        middot: '\u00B7',
        cedil: '\u00B8',
        sup1: '\u00B9',
        ordm: '\u00BA',
        raquo: '\u00BB',
        frac14: '\u00BC',
        frac12: '\u00BD',
        frac34: '\u00BE',
        iquest: '\u00BF',
        Agrave: '\u00C0',
        Aacute: '\u00C1',
        Acirc: '\u00C2',
        Atilde: '\u00C3',
        Auml: '\u00C4',
        Aring: '\u00C5',
        AElig: '\u00C6',
        Ccedil: '\u00C7',
        Egrave: '\u00C8',
        Eacute: '\u00C9',
        Ecirc: '\u00CA',
        Euml: '\u00CB',
        Igrave: '\u00CC',
        Iacute: '\u00CD',
        Icirc: '\u00CE',
        Iuml: '\u00CF',
        ETH: '\u00D0',
        Ntilde: '\u00D1',
        Ograve: '\u00D2',
        Oacute: '\u00D3',
        Ocirc: '\u00D4',
        Otilde: '\u00D5',
        Ouml: '\u00D6',
        times: '\u00D7',
        Oslash: '\u00D8',
        Ugrave: '\u00D9',
        Uacute: '\u00DA',
        Ucirc: '\u00DB',
        Uuml: '\u00DC',
        Yacute: '\u00DD',
        THORN: '\u00DE',
        szlig: '\u00DF',
        agrave: '\u00E0',
        aacute: '\u00E1',
        acirc: '\u00E2',
        atilde: '\u00E3',
        auml: '\u00E4',
        aring: '\u00E5',
        aelig: '\u00E6',
        ccedil: '\u00E7',
        egrave: '\u00E8',
        eacute: '\u00E9',
        ecirc: '\u00EA',
        euml: '\u00EB',
        igrave: '\u00EC',
        iacute: '\u00ED',
        icirc: '\u00EE',
        iuml: '\u00EF',
        eth: '\u00F0',
        ntilde: '\u00F1',
        ograve: '\u00F2',
        oacute: '\u00F3',
        ocirc: '\u00F4',
        otilde: '\u00F5',
        ouml: '\u00F6',
        divide: '\u00F7',
        oslash: '\u00F8',
        ugrave: '\u00F9',
        uacute: '\u00FA',
        ucirc: '\u00FB',
        uuml: '\u00FC',
        yacute: '\u00FD',
        thorn: '\u00FE',
        yuml: '\u00FF',
        OElig: '\u0152',
        oelig: '\u0153',
        Scaron: '\u0160',
        scaron: '\u0161',
        Yuml: '\u0178',
        fnof: '\u0192',
        circ: '\u02C6',
        tilde: '\u02DC',
        Alpha: '\u0391',
        Beta: '\u0392',
        Gamma: '\u0393',
        Delta: '\u0394',
        Epsilon: '\u0395',
        Zeta: '\u0396',
        Eta: '\u0397',
        Theta: '\u0398',
        Iota: '\u0399',
        Kappa: '\u039A',
        Lambda: '\u039B',
        Mu: '\u039C',
        Nu: '\u039D',
        Xi: '\u039E',
        Omicron: '\u039F',
        Pi: '\u03A0',
        Rho: '\u03A1',
        Sigma: '\u03A3',
        Tau: '\u03A4',
        Upsilon: '\u03A5',
        Phi: '\u03A6',
        Chi: '\u03A7',
        Psi: '\u03A8',
        Omega: '\u03A9',
        alpha: '\u03B1',
        beta: '\u03B2',
        gamma: '\u03B3',
        delta: '\u03B4',
        epsilon: '\u03B5',
        zeta: '\u03B6',
        eta: '\u03B7',
        theta: '\u03B8',
        iota: '\u03B9',
        kappa: '\u03BA',
        lambda: '\u03BB',
        mu: '\u03BC',
        nu: '\u03BD',
        xi: '\u03BE',
        omicron: '\u03BF',
        pi: '\u03C0',
        rho: '\u03C1',
        sigmaf: '\u03C2',
        sigma: '\u03C3',
        tau: '\u03C4',
        upsilon: '\u03C5',
        phi: '\u03C6',
        chi: '\u03C7',
        psi: '\u03C8',
        omega: '\u03C9',
        thetasym: '\u03D1',
        upsih: '\u03D2',
        piv: '\u03D6',
        ensp: '\u2002',
        emsp: '\u2003',
        thinsp: '\u2009',
        zwnj: '\u200C',
        zwj: '\u200D',
        lrm: '\u200E',
        rlm: '\u200F',
        ndash: '\u2013',
        mdash: '\u2014',
        lsquo: '\u2018',
        rsquo: '\u2019',
        sbquo: '\u201A',
        ldquo: '\u201C',
        rdquo: '\u201D',
        bdquo: '\u201E',
        dagger: '\u2020',
        Dagger: '\u2021',
        bull: '\u2022',
        hellip: '\u2026',
        permil: '\u2030',
        prime: '\u2032',
        Prime: '\u2033',
        lsaquo: '\u2039',
        rsaquo: '\u203A',
        oline: '\u203E',
        frasl: '\u2044',
        euro: '\u20AC',
        image: '\u2111',
        weierp: '\u2118',
        real: '\u211C',
        trade: '\u2122',
        alefsym: '\u2135',
        larr: '\u2190',
        uarr: '\u2191',
        rarr: '\u2192',
        darr: '\u2193',
        harr: '\u2194',
        crarr: '\u21B5',
        lArr: '\u21D0',
        uArr: '\u21D1',
        rArr: '\u21D2',
        dArr: '\u21D3',
        hArr: '\u21D4',
        forall: '\u2200',
        part: '\u2202',
        exist: '\u2203',
        empty: '\u2205',
        nabla: '\u2207',
        isin: '\u2208',
        notin: '\u2209',
        ni: '\u220B',
        prod: '\u220F',
        sum: '\u2211',
        minus: '\u2212',
        lowast: '\u2217',
        radic: '\u221A',
        prop: '\u221D',
        infin: '\u221E',
        ang: '\u2220',
        and: '\u2227',
        or: '\u2228',
        cap: '\u2229',
        cup: '\u222A',
        'int': '\u222B',
        there4: '\u2234',
        sim: '\u223C',
        cong: '\u2245',
        asymp: '\u2248',
        ne: '\u2260',
        equiv: '\u2261',
        le: '\u2264',
        ge: '\u2265',
        sub: '\u2282',
        sup: '\u2283',
        nsub: '\u2284',
        sube: '\u2286',
        supe: '\u2287',
        oplus: '\u2295',
        otimes: '\u2297',
        perp: '\u22A5',
        sdot: '\u22C5',
        lceil: '\u2308',
        rceil: '\u2309',
        lfloor: '\u230A',
        rfloor: '\u230B',
        lang: '\u2329',
        rang: '\u232A',
        loz: '\u25CA',
        spades: '\u2660',
        clubs: '\u2663',
        hearts: '\u2665',
        diams: '\u2666'
    };

    function getQualifiedXJSName(object) {
        if (object.type === Syntax.XJSIdentifier) {
            return object.name;
        }
        if (object.type === Syntax.XJSNamespacedName) {
            return object.namespace.name + ':' + object.name.name;
        }
        if (object.type === Syntax.XJSMemberExpression) {
            return (
                getQualifiedXJSName(object.object) + '.' +
                getQualifiedXJSName(object.property)
            );
        }
    }

    function isXJSIdentifierStart(ch) {
        // exclude backslash (\)
        return (ch !== 92) && isIdentifierStart(ch);
    }

    function isXJSIdentifierPart(ch) {
        // exclude backslash (\) and add hyphen (-)
        return (ch !== 92) && (ch === 45 || isIdentifierPart(ch));
    }

    function scanXJSIdentifier() {
        var ch, start, value = '';

        start = index;
        while (index < length) {
            ch = source.charCodeAt(index);
            if (!isXJSIdentifierPart(ch)) {
                break;
            }
            value += source[index++];
        }

        return {
            type: Token.XJSIdentifier,
            value: value,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    function scanXJSEntity() {
        var ch, str = '', start = index, count = 0, code;
        ch = source[index];
        assert(ch === '&', 'Entity must start with an ampersand');
        index++;
        while (index < length && count++ < 10) {
            ch = source[index++];
            if (ch === ';') {
                break;
            }
            str += ch;
        }

        // Well-formed entity (ending was found).
        if (ch === ';') {
            // Numeric entity.
            if (str[0] === '#') {
                if (str[1] === 'x') {
                    code = +('0' + str.substr(1));
                } else {
                    // Removing leading zeros in order to avoid treating as octal in old browsers.
                    code = +str.substr(1).replace(Regex.LeadingZeros, '');
                }

                if (!isNaN(code)) {
                    return String.fromCharCode(code);
                }
            } else if (XHTMLEntities[str]) {
                return XHTMLEntities[str];
            }
        }

        // Treat non-entity sequences as regular text.
        index = start + 1;
        return '&';
    }

    function scanXJSText(stopChars) {
        var ch, str = '', start;
        start = index;
        while (index < length) {
            ch = source[index];
            if (stopChars.indexOf(ch) !== -1) {
                break;
            }
            if (ch === '&') {
                str += scanXJSEntity();
            } else {
                index++;
                if (ch === '\r' && source[index] === '\n') {
                    str += ch;
                    ch = source[index];
                    index++;
                }
                if (isLineTerminator(ch.charCodeAt(0))) {
                    ++lineNumber;
                    lineStart = index;
                }
                str += ch;
            }
        }
        return {
            type: Token.XJSText,
            value: str,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    function scanXJSStringLiteral() {
        var innerToken, quote, start;

        quote = source[index];
        assert((quote === '\'' || quote === '"'),
            'String literal must starts with a quote');

        start = index;
        ++index;

        innerToken = scanXJSText([quote]);

        if (quote !== source[index]) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        ++index;

        innerToken.range = [start, index];

        return innerToken;
    }

    /**
     * Between XJS opening and closing tags (e.g. <foo>HERE</foo>), anything that
     * is not another XJS tag and is not an expression wrapped by {} is text.
     */
    function advanceXJSChild() {
        var ch = source.charCodeAt(index);

        // { (123) and < (60)
        if (ch !== 123 && ch !== 60) {
            return scanXJSText(['<', '{']);
        }

        return scanPunctuator();
    }

    function parseXJSIdentifier() {
        var token, marker = markerCreate();

        if (lookahead.type !== Token.XJSIdentifier) {
            throwUnexpected(lookahead);
        }

        token = lex();
        return markerApply(marker, delegate.createXJSIdentifier(token.value));
    }

    function parseXJSNamespacedName() {
        var namespace, name, marker = markerCreate();

        namespace = parseXJSIdentifier();
        expect(':');
        name = parseXJSIdentifier();

        return markerApply(marker, delegate.createXJSNamespacedName(namespace, name));
    }

    function parseXJSMemberExpression() {
        var marker = markerCreate(),
            expr = parseXJSIdentifier();

        while (match('.')) {
            lex();
            expr = markerApply(marker, delegate.createXJSMemberExpression(expr, parseXJSIdentifier()));
        }

        return expr;
    }

    function parseXJSElementName() {
        if (lookahead2().value === ':') {
            return parseXJSNamespacedName();
        }
        if (lookahead2().value === '.') {
            return parseXJSMemberExpression();
        }

        return parseXJSIdentifier();
    }

    function parseXJSAttributeName() {
        if (lookahead2().value === ':') {
            return parseXJSNamespacedName();
        }

        return parseXJSIdentifier();
    }

    function parseXJSAttributeValue() {
        var value, marker;
        if (match('{')) {
            value = parseXJSExpressionContainer();
            if (value.expression.type === Syntax.XJSEmptyExpression) {
                throwError(
                    value,
                    'XJS attributes must only be assigned a non-empty ' +
                        'expression'
                );
            }
        } else if (match('<')) {
            value = parseXJSElement();
        } else if (lookahead.type === Token.XJSText) {
            marker = markerCreate();
            value = markerApply(marker, delegate.createLiteral(lex()));
        } else {
            throwError({}, Messages.InvalidXJSAttributeValue);
        }
        return value;
    }

    function parseXJSEmptyExpression() {
        var marker = markerCreatePreserveWhitespace();
        while (source.charAt(index) !== '}') {
            index++;
        }
        return markerApply(marker, delegate.createXJSEmptyExpression());
    }

    function parseXJSExpressionContainer() {
        var expression, origInXJSChild, origInXJSTag, marker = markerCreate();

        origInXJSChild = state.inXJSChild;
        origInXJSTag = state.inXJSTag;
        state.inXJSChild = false;
        state.inXJSTag = false;

        expect('{');

        if (match('}')) {
            expression = parseXJSEmptyExpression();
        } else {
            expression = parseExpression();
        }

        state.inXJSChild = origInXJSChild;
        state.inXJSTag = origInXJSTag;

        expect('}');

        return markerApply(marker, delegate.createXJSExpressionContainer(expression));
    }

    function parseXJSSpreadAttribute() {
        var expression, origInXJSChild, origInXJSTag, marker = markerCreate();

        origInXJSChild = state.inXJSChild;
        origInXJSTag = state.inXJSTag;
        state.inXJSChild = false;
        state.inXJSTag = false;

        expect('{');
        expect('...');

        expression = parseAssignmentExpression();

        state.inXJSChild = origInXJSChild;
        state.inXJSTag = origInXJSTag;

        expect('}');

        return markerApply(marker, delegate.createXJSSpreadAttribute(expression));
    }

    function parseXJSAttribute() {
        var name, marker;

        if (match('{')) {
            return parseXJSSpreadAttribute();
        }

        marker = markerCreate();

        name = parseXJSAttributeName();

        // HTML empty attribute
        if (match('=')) {
            lex();
            return markerApply(marker, delegate.createXJSAttribute(name, parseXJSAttributeValue()));
        }

        return markerApply(marker, delegate.createXJSAttribute(name));
    }

    function parseXJSChild() {
        var token, marker;
        if (match('{')) {
            token = parseXJSExpressionContainer();
        } else if (lookahead.type === Token.XJSText) {
            marker = markerCreatePreserveWhitespace();
            token = markerApply(marker, delegate.createLiteral(lex()));
        } else {
            token = parseXJSElement();
        }
        return token;
    }

    function parseXJSClosingElement() {
        var name, origInXJSChild, origInXJSTag, marker = markerCreate();
        origInXJSChild = state.inXJSChild;
        origInXJSTag = state.inXJSTag;
        state.inXJSChild = false;
        state.inXJSTag = true;
        expect('<');
        expect('/');
        name = parseXJSElementName();
        // Because advance() (called by lex() called by expect()) expects there
        // to be a valid token after >, it needs to know whether to look for a
        // standard JS token or an XJS text node
        state.inXJSChild = origInXJSChild;
        state.inXJSTag = origInXJSTag;
        expect('>');
        return markerApply(marker, delegate.createXJSClosingElement(name));
    }

    function parseXJSOpeningElement() {
        var name, attribute, attributes = [], selfClosing = false, origInXJSChild, origInXJSTag, marker = markerCreate();

        origInXJSChild = state.inXJSChild;
        origInXJSTag = state.inXJSTag;
        state.inXJSChild = false;
        state.inXJSTag = true;

        expect('<');

        name = parseXJSElementName();

        while (index < length &&
                lookahead.value !== '/' &&
                lookahead.value !== '>') {
            attributes.push(parseXJSAttribute());
        }

        state.inXJSTag = origInXJSTag;

        if (lookahead.value === '/') {
            expect('/');
            // Because advance() (called by lex() called by expect()) expects
            // there to be a valid token after >, it needs to know whether to
            // look for a standard JS token or an XJS text node
            state.inXJSChild = origInXJSChild;
            expect('>');
            selfClosing = true;
        } else {
            state.inXJSChild = true;
            expect('>');
        }
        return markerApply(marker, delegate.createXJSOpeningElement(name, attributes, selfClosing));
    }

    function parseXJSElement() {
        var openingElement, closingElement = null, children = [], origInXJSChild, origInXJSTag, marker = markerCreate();

        origInXJSChild = state.inXJSChild;
        origInXJSTag = state.inXJSTag;
        openingElement = parseXJSOpeningElement();

        if (!openingElement.selfClosing) {
            while (index < length) {
                state.inXJSChild = false; // Call lookahead2() with inXJSChild = false because </ should not be considered in the child
                if (lookahead.value === '<' && lookahead2().value === '/') {
                    break;
                }
                state.inXJSChild = true;
                children.push(parseXJSChild());
            }
            state.inXJSChild = origInXJSChild;
            state.inXJSTag = origInXJSTag;
            closingElement = parseXJSClosingElement();
            if (getQualifiedXJSName(closingElement.name) !== getQualifiedXJSName(openingElement.name)) {
                throwError({}, Messages.ExpectedXJSClosingTag, getQualifiedXJSName(openingElement.name));
            }
        }

        // When (erroneously) writing two adjacent tags like
        //
        //     var x = <div>one</div><div>two</div>;
        //
        // the default error message is a bit incomprehensible. Since it's
        // rarely (never?) useful to write a less-than sign after an XJS
        // element, we disallow it here in the parser in order to provide a
        // better error message. (In the rare case that the less-than operator
        // was intended, the left tag can be wrapped in parentheses.)
        if (!origInXJSChild && match('<')) {
            throwError(lookahead, Messages.AdjacentXJSElements);
        }

        return markerApply(marker, delegate.createXJSElement(openingElement, closingElement, children));
    }

    function parseTypeAlias() {
        var id, marker = markerCreate(), typeParameters = null, right;
        expectContextualKeyword('type');
        id = parseVariableIdentifier();
        if (match('<')) {
            typeParameters = parseTypeParameterDeclaration();
        }
        expect('=');
        right = parseType();
        consumeSemicolon();
        return markerApply(marker, delegate.createTypeAlias(id, typeParameters, right));
    }

    function parseInterfaceExtends() {
        var marker = markerCreate(), id, typeParameters = null;

        id = parseVariableIdentifier();
        if (match('<')) {
            typeParameters = parseTypeParameterInstantiation();
        }

        return markerApply(marker, delegate.createInterfaceExtends(
            id,
            typeParameters
        ));
    }

    function parseInterfaceish(marker, allowStatic) {
        var body, bodyMarker, extended = [], id,
            typeParameters = null;

        id = parseVariableIdentifier();
        if (match('<')) {
            typeParameters = parseTypeParameterDeclaration();
        }

        if (matchKeyword('extends')) {
            expectKeyword('extends');

            while (index < length) {
                extended.push(parseInterfaceExtends());
                if (!match(',')) {
                    break;
                }
                expect(',');
            }
        }

        bodyMarker = markerCreate();
        body = markerApply(bodyMarker, parseObjectType(allowStatic));

        return markerApply(marker, delegate.createInterface(
            id,
            typeParameters,
            body,
            extended
        ));
    }

    function parseInterface() {
        var body, bodyMarker, extended = [], id, marker = markerCreate(),
            typeParameters = null;

        expectContextualKeyword('interface');
        return parseInterfaceish(marker, /* allowStatic */false);
    }

    function parseDeclareClass() {
        var marker = markerCreate(), ret;
        expectContextualKeyword('declare');
        expectKeyword('class');

        ret = parseInterfaceish(marker, /* allowStatic */true);
        ret.type = Syntax.DeclareClass;
        return ret;
    }

    function parseDeclareFunction() {
        var id, idMarker,
            marker = markerCreate(), params, returnType, rest, tmp,
            typeParameters = null, value, valueMarker;

        expectContextualKeyword('declare');
        expectKeyword('function');
        idMarker = markerCreate();
        id = parseVariableIdentifier();

        valueMarker = markerCreate();
        if (match('<')) {
            typeParameters = parseTypeParameterDeclaration();
        }
        expect('(');
        tmp = parseFunctionTypeParams();
        params = tmp.params;
        rest = tmp.rest;
        expect(')');

        expect(':');
        returnType = parseType();

        value = markerApply(valueMarker, delegate.createFunctionTypeAnnotation(
            params,
            returnType,
            rest,
            typeParameters
        ));

        id.typeAnnotation = markerApply(valueMarker, delegate.createTypeAnnotation(
            value
        ));
        markerApply(idMarker, id);

        consumeSemicolon();

        return markerApply(marker, delegate.createDeclareFunction(
            id
        ));
    }

    function parseDeclareVariable() {
        var id, marker = markerCreate();
        expectContextualKeyword('declare');
        expectKeyword('var');
        id = parseTypeAnnotatableIdentifier();

        consumeSemicolon();

        return markerApply(marker, delegate.createDeclareVariable(
            id
        ));
    }

    function parseDeclareModule() {
        var body = [], bodyMarker, id, idMarker, marker = markerCreate(), token;
        expectContextualKeyword('declare');
        expectContextualKeyword('module');

        if (lookahead.type === Token.StringLiteral) {
            if (strict && lookahead.octal) {
                throwErrorTolerant(lookahead, Messages.StrictOctalLiteral);
            }
            idMarker = markerCreate();
            id = markerApply(idMarker, delegate.createLiteral(lex()));
        } else {
            id = parseVariableIdentifier();
        }

        bodyMarker = markerCreate();
        expect('{');
        while (index < length && !match('}')) {
            token = lookahead2();
            switch (token.value) {
            case 'class':
                body.push(parseDeclareClass());
                break;
            case 'function':
                body.push(parseDeclareFunction());
                break;
            case 'var':
                body.push(parseDeclareVariable());
                break;
            default:
                throwUnexpected(lookahead);
            }
        }
        expect('}');

        return markerApply(marker, delegate.createDeclareModule(
            id,
            markerApply(bodyMarker, delegate.createBlockStatement(body))
        ));
    }

    function collectToken() {
        var start, loc, token, range, value, entry;

        if (!state.inXJSChild) {
            skipComment();
        }

        start = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        token = extra.advance();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        if (token.type !== Token.EOF) {
            range = [token.range[0], token.range[1]];
            value = source.slice(token.range[0], token.range[1]);
            entry = {
                type: TokenName[token.type],
                value: value,
                range: range,
                loc: loc
            };
            if (token.regex) {
                entry.regex = {
                    pattern: token.regex.pattern,
                    flags: token.regex.flags
                };
            }
            extra.tokens.push(entry);
        }

        return token;
    }

    function collectRegex() {
        var pos, loc, regex, token;

        skipComment();

        pos = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        regex = extra.scanRegExp();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        if (!extra.tokenize) {
            // Pop the previous token, which is likely '/' or '/='
            if (extra.tokens.length > 0) {
                token = extra.tokens[extra.tokens.length - 1];
                if (token.range[0] === pos && token.type === 'Punctuator') {
                    if (token.value === '/' || token.value === '/=') {
                        extra.tokens.pop();
                    }
                }
            }

            extra.tokens.push({
                type: 'RegularExpression',
                value: regex.literal,
                regex: regex.regex,
                range: [pos, index],
                loc: loc
            });
        }

        return regex;
    }

    function filterTokenLocation() {
        var i, entry, token, tokens = [];

        for (i = 0; i < extra.tokens.length; ++i) {
            entry = extra.tokens[i];
            token = {
                type: entry.type,
                value: entry.value
            };
            if (entry.regex) {
                token.regex = {
                    pattern: entry.regex.pattern,
                    flags: entry.regex.flags
                };
            }
            if (extra.range) {
                token.range = entry.range;
            }
            if (extra.loc) {
                token.loc = entry.loc;
            }
            tokens.push(token);
        }

        extra.tokens = tokens;
    }

    function patch() {
        if (extra.comments) {
            extra.skipComment = skipComment;
            skipComment = scanComment;
        }

        if (typeof extra.tokens !== 'undefined') {
            extra.advance = advance;
            extra.scanRegExp = scanRegExp;

            advance = collectToken;
            scanRegExp = collectRegex;
        }
    }

    function unpatch() {
        if (typeof extra.skipComment === 'function') {
            skipComment = extra.skipComment;
        }

        if (typeof extra.scanRegExp === 'function') {
            advance = extra.advance;
            scanRegExp = extra.scanRegExp;
        }
    }

    // This is used to modify the delegate.

    function extend(object, properties) {
        var entry, result = {};

        for (entry in object) {
            if (object.hasOwnProperty(entry)) {
                result[entry] = object[entry];
            }
        }

        for (entry in properties) {
            if (properties.hasOwnProperty(entry)) {
                result[entry] = properties[entry];
            }
        }

        return result;
    }

    function tokenize(code, options) {
        var toString,
            token,
            tokens;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        delegate = SyntaxTreeDelegate;
        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        length = source.length;
        lookahead = null;
        state = {
            allowKeyword: true,
            allowIn: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1
        };

        extra = {};

        // Options matching.
        options = options || {};

        // Of course we collect tokens here.
        options.tokens = true;
        extra.tokens = [];
        extra.tokenize = true;
        // The following two fields are necessary to compute the Regex tokens.
        extra.openParenToken = -1;
        extra.openCurlyToken = -1;

        extra.range = (typeof options.range === 'boolean') && options.range;
        extra.loc = (typeof options.loc === 'boolean') && options.loc;

        if (typeof options.comment === 'boolean' && options.comment) {
            extra.comments = [];
        }
        if (typeof options.tolerant === 'boolean' && options.tolerant) {
            extra.errors = [];
        }

        if (length > 0) {
            if (typeof source[0] === 'undefined') {
                // Try first to convert to a string. This is good as fast path
                // for old IE which understands string indexing for string
                // literals only and not for string object.
                if (code instanceof String) {
                    source = code.valueOf();
                }
            }
        }

        patch();

        try {
            peek();
            if (lookahead.type === Token.EOF) {
                return extra.tokens;
            }

            token = lex();
            while (lookahead.type !== Token.EOF) {
                try {
                    token = lex();
                } catch (lexError) {
                    token = lookahead;
                    if (extra.errors) {
                        extra.errors.push(lexError);
                        // We have to break on the first error
                        // to avoid infinite loops.
                        break;
                    } else {
                        throw lexError;
                    }
                }
            }

            filterTokenLocation();
            tokens = extra.tokens;
            if (typeof extra.comments !== 'undefined') {
                tokens.comments = extra.comments;
            }
            if (typeof extra.errors !== 'undefined') {
                tokens.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            unpatch();
            extra = {};
        }
        return tokens;
    }

    function parse(code, options) {
        var program, toString;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        delegate = SyntaxTreeDelegate;
        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        length = source.length;
        lookahead = null;
        state = {
            allowKeyword: false,
            allowIn: true,
            labelSet: {},
            parenthesizedCount: 0,
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            inXJSChild: false,
            inXJSTag: false,
            inType: false,
            lastCommentStart: -1,
            yieldAllowed: false,
            awaitAllowed: false
        };

        extra = {};
        if (typeof options !== 'undefined') {
            extra.range = (typeof options.range === 'boolean') && options.range;
            extra.loc = (typeof options.loc === 'boolean') && options.loc;
            extra.attachComment = (typeof options.attachComment === 'boolean') && options.attachComment;

            if (extra.loc && options.source !== null && options.source !== undefined) {
                delegate = extend(delegate, {
                    'postProcess': function (node) {
                        node.loc.source = toString(options.source);
                        return node;
                    }
                });
            }

            if (typeof options.tokens === 'boolean' && options.tokens) {
                extra.tokens = [];
            }
            if (typeof options.comment === 'boolean' && options.comment) {
                extra.comments = [];
            }
            if (typeof options.tolerant === 'boolean' && options.tolerant) {
                extra.errors = [];
            }
            if (extra.attachComment) {
                extra.range = true;
                extra.comments = [];
                extra.bottomRightStack = [];
                extra.trailingComments = [];
                extra.leadingComments = [];
            }
        }

        if (length > 0) {
            if (typeof source[0] === 'undefined') {
                // Try first to convert to a string. This is good as fast path
                // for old IE which understands string indexing for string
                // literals only and not for string object.
                if (code instanceof String) {
                    source = code.valueOf();
                }
            }
        }

        patch();
        try {
            program = parseProgram();
            if (typeof extra.comments !== 'undefined') {
                program.comments = extra.comments;
            }
            if (typeof extra.tokens !== 'undefined') {
                filterTokenLocation();
                program.tokens = extra.tokens;
            }
            if (typeof extra.errors !== 'undefined') {
                program.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            unpatch();
            extra = {};
        }

        return program;
    }

    // Sync with *.json manifests.
    exports.version = '8001.1001.0-dev-harmony-fb';

    exports.tokenize = tokenize;

    exports.parse = parse;

    // Deep copy.
    exports.Syntax = (function () {
        var name, types = {};

        if (typeof Object.create === 'function') {
            types = Object.create(null);
        }

        for (name in Syntax) {
            if (Syntax.hasOwnProperty(name)) {
                types[name] = Syntax[name];
            }
        }

        if (typeof Object.freeze === 'function') {
            Object.freeze(types);
        }

        return types;
    }());

}));
/* vim: set sw=4 ts=4 et tw=80 : */

},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map.js":[function(require,module,exports){
/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
exports.SourceMapGenerator = require('./source-map/source-map-generator').SourceMapGenerator;
exports.SourceMapConsumer = require('./source-map/source-map-consumer').SourceMapConsumer;
exports.SourceNode = require('./source-map/source-node').SourceNode;

},{"./source-map/source-map-consumer":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/source-map-consumer.js","./source-map/source-map-generator":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/source-map-generator.js","./source-map/source-node":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/source-node.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/array-set.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var util = require('./util');

  /**
   * A data structure which is a combination of an array and a set. Adding a new
   * member is O(1), testing for membership is O(1), and finding the index of an
   * element is O(1). Removing elements from the set is not supported. Only
   * strings are supported for membership.
   */
  function ArraySet() {
    this._array = [];
    this._set = {};
  }

  /**
   * Static method for creating ArraySet instances from an existing array.
   */
  ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
    var set = new ArraySet();
    for (var i = 0, len = aArray.length; i < len; i++) {
      set.add(aArray[i], aAllowDuplicates);
    }
    return set;
  };

  /**
   * Add the given string to this set.
   *
   * @param String aStr
   */
  ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
    var isDuplicate = this.has(aStr);
    var idx = this._array.length;
    if (!isDuplicate || aAllowDuplicates) {
      this._array.push(aStr);
    }
    if (!isDuplicate) {
      this._set[util.toSetString(aStr)] = idx;
    }
  };

  /**
   * Is the given string a member of this set?
   *
   * @param String aStr
   */
  ArraySet.prototype.has = function ArraySet_has(aStr) {
    return Object.prototype.hasOwnProperty.call(this._set,
                                                util.toSetString(aStr));
  };

  /**
   * What is the index of the given string in the array?
   *
   * @param String aStr
   */
  ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
    if (this.has(aStr)) {
      return this._set[util.toSetString(aStr)];
    }
    throw new Error('"' + aStr + '" is not in the set.');
  };

  /**
   * What is the element at the given index?
   *
   * @param Number aIdx
   */
  ArraySet.prototype.at = function ArraySet_at(aIdx) {
    if (aIdx >= 0 && aIdx < this._array.length) {
      return this._array[aIdx];
    }
    throw new Error('No element indexed by ' + aIdx);
  };

  /**
   * Returns the array representation of this set (which has the proper indices
   * indicated by indexOf). Note that this is a copy of the internal array used
   * for storing the members so that no one can mess with internal state.
   */
  ArraySet.prototype.toArray = function ArraySet_toArray() {
    return this._array.slice();
  };

  exports.ArraySet = ArraySet;

});

},{"./util":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/util.js","amdefine":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/node_modules/amdefine/amdefine.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/base64-vlq.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var base64 = require('./base64');

  // A single base 64 digit can contain 6 bits of data. For the base 64 variable
  // length quantities we use in the source map spec, the first bit is the sign,
  // the next four bits are the actual value, and the 6th bit is the
  // continuation bit. The continuation bit tells us whether there are more
  // digits in this value following this digit.
  //
  //   Continuation
  //   |    Sign
  //   |    |
  //   V    V
  //   101011

  var VLQ_BASE_SHIFT = 5;

  // binary: 100000
  var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

  // binary: 011111
  var VLQ_BASE_MASK = VLQ_BASE - 1;

  // binary: 100000
  var VLQ_CONTINUATION_BIT = VLQ_BASE;

  /**
   * Converts from a two-complement value to a value where the sign bit is
   * is placed in the least significant bit.  For example, as decimals:
   *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
   *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
   */
  function toVLQSigned(aValue) {
    return aValue < 0
      ? ((-aValue) << 1) + 1
      : (aValue << 1) + 0;
  }

  /**
   * Converts to a two-complement value from a value where the sign bit is
   * is placed in the least significant bit.  For example, as decimals:
   *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
   *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
   */
  function fromVLQSigned(aValue) {
    var isNegative = (aValue & 1) === 1;
    var shifted = aValue >> 1;
    return isNegative
      ? -shifted
      : shifted;
  }

  /**
   * Returns the base 64 VLQ encoded value.
   */
  exports.encode = function base64VLQ_encode(aValue) {
    var encoded = "";
    var digit;

    var vlq = toVLQSigned(aValue);

    do {
      digit = vlq & VLQ_BASE_MASK;
      vlq >>>= VLQ_BASE_SHIFT;
      if (vlq > 0) {
        // There are still more digits in this value, so we must make sure the
        // continuation bit is marked.
        digit |= VLQ_CONTINUATION_BIT;
      }
      encoded += base64.encode(digit);
    } while (vlq > 0);

    return encoded;
  };

  /**
   * Decodes the next base 64 VLQ value from the given string and returns the
   * value and the rest of the string.
   */
  exports.decode = function base64VLQ_decode(aStr) {
    var i = 0;
    var strLen = aStr.length;
    var result = 0;
    var shift = 0;
    var continuation, digit;

    do {
      if (i >= strLen) {
        throw new Error("Expected more digits in base 64 VLQ value.");
      }
      digit = base64.decode(aStr.charAt(i++));
      continuation = !!(digit & VLQ_CONTINUATION_BIT);
      digit &= VLQ_BASE_MASK;
      result = result + (digit << shift);
      shift += VLQ_BASE_SHIFT;
    } while (continuation);

    return {
      value: fromVLQSigned(result),
      rest: aStr.slice(i)
    };
  };

});

},{"./base64":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/base64.js","amdefine":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/node_modules/amdefine/amdefine.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/base64.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var charToIntMap = {};
  var intToCharMap = {};

  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    .split('')
    .forEach(function (ch, index) {
      charToIntMap[ch] = index;
      intToCharMap[index] = ch;
    });

  /**
   * Encode an integer in the range of 0 to 63 to a single base 64 digit.
   */
  exports.encode = function base64_encode(aNumber) {
    if (aNumber in intToCharMap) {
      return intToCharMap[aNumber];
    }
    throw new TypeError("Must be between 0 and 63: " + aNumber);
  };

  /**
   * Decode a single base 64 digit to an integer.
   */
  exports.decode = function base64_decode(aChar) {
    if (aChar in charToIntMap) {
      return charToIntMap[aChar];
    }
    throw new TypeError("Not a valid base 64 digit: " + aChar);
  };

});

},{"amdefine":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/node_modules/amdefine/amdefine.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/binary-search.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  /**
   * Recursive implementation of binary search.
   *
   * @param aLow Indices here and lower do not contain the needle.
   * @param aHigh Indices here and higher do not contain the needle.
   * @param aNeedle The element being searched for.
   * @param aHaystack The non-empty array being searched.
   * @param aCompare Function which takes two elements and returns -1, 0, or 1.
   */
  function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare) {
    // This function terminates when one of the following is true:
    //
    //   1. We find the exact element we are looking for.
    //
    //   2. We did not find the exact element, but we can return the next
    //      closest element that is less than that element.
    //
    //   3. We did not find the exact element, and there is no next-closest
    //      element which is less than the one we are searching for, so we
    //      return null.
    var mid = Math.floor((aHigh - aLow) / 2) + aLow;
    var cmp = aCompare(aNeedle, aHaystack[mid], true);
    if (cmp === 0) {
      // Found the element we are looking for.
      return aHaystack[mid];
    }
    else if (cmp > 0) {
      // aHaystack[mid] is greater than our needle.
      if (aHigh - mid > 1) {
        // The element is in the upper half.
        return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare);
      }
      // We did not find an exact match, return the next closest one
      // (termination case 2).
      return aHaystack[mid];
    }
    else {
      // aHaystack[mid] is less than our needle.
      if (mid - aLow > 1) {
        // The element is in the lower half.
        return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare);
      }
      // The exact needle element was not found in this haystack. Determine if
      // we are in termination case (2) or (3) and return the appropriate thing.
      return aLow < 0
        ? null
        : aHaystack[aLow];
    }
  }

  /**
   * This is an implementation of binary search which will always try and return
   * the next lowest value checked if there is no exact hit. This is because
   * mappings between original and generated line/col pairs are single points,
   * and there is an implicit region between each of them, so a miss just means
   * that you aren't on the very start of a region.
   *
   * @param aNeedle The element you are looking for.
   * @param aHaystack The array that is being searched.
   * @param aCompare A function which takes the needle and an element in the
   *     array and returns -1, 0, or 1 depending on whether the needle is less
   *     than, equal to, or greater than the element, respectively.
   */
  exports.search = function search(aNeedle, aHaystack, aCompare) {
    return aHaystack.length > 0
      ? recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack, aCompare)
      : null;
  };

});

},{"amdefine":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/node_modules/amdefine/amdefine.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/source-map-consumer.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var util = require('./util');
  var binarySearch = require('./binary-search');
  var ArraySet = require('./array-set').ArraySet;
  var base64VLQ = require('./base64-vlq');

  /**
   * A SourceMapConsumer instance represents a parsed source map which we can
   * query for information about the original file positions by giving it a file
   * position in the generated source.
   *
   * The only parameter is the raw source map (either as a JSON string, or
   * already parsed to an object). According to the spec, source maps have the
   * following attributes:
   *
   *   - version: Which version of the source map spec this map is following.
   *   - sources: An array of URLs to the original source files.
   *   - names: An array of identifiers which can be referrenced by individual mappings.
   *   - sourceRoot: Optional. The URL root from which all sources are relative.
   *   - sourcesContent: Optional. An array of contents of the original source files.
   *   - mappings: A string of base64 VLQs which contain the actual mappings.
   *   - file: The generated file this source map is associated with.
   *
   * Here is an example source map, taken from the source map spec[0]:
   *
   *     {
   *       version : 3,
   *       file: "out.js",
   *       sourceRoot : "",
   *       sources: ["foo.js", "bar.js"],
   *       names: ["src", "maps", "are", "fun"],
   *       mappings: "AA,AB;;ABCDE;"
   *     }
   *
   * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
   */
  function SourceMapConsumer(aSourceMap) {
    var sourceMap = aSourceMap;
    if (typeof aSourceMap === 'string') {
      sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
    }

    var version = util.getArg(sourceMap, 'version');
    var sources = util.getArg(sourceMap, 'sources');
    // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
    // requires the array) to play nice here.
    var names = util.getArg(sourceMap, 'names', []);
    var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
    var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
    var mappings = util.getArg(sourceMap, 'mappings');
    var file = util.getArg(sourceMap, 'file', null);

    // Once again, Sass deviates from the spec and supplies the version as a
    // string rather than a number, so we use loose equality checking here.
    if (version != this._version) {
      throw new Error('Unsupported version: ' + version);
    }

    // Pass `true` below to allow duplicate names and sources. While source maps
    // are intended to be compressed and deduplicated, the TypeScript compiler
    // sometimes generates source maps with duplicates in them. See Github issue
    // #72 and bugzil.la/889492.
    this._names = ArraySet.fromArray(names, true);
    this._sources = ArraySet.fromArray(sources, true);

    this.sourceRoot = sourceRoot;
    this.sourcesContent = sourcesContent;
    this._mappings = mappings;
    this.file = file;
  }

  /**
   * Create a SourceMapConsumer from a SourceMapGenerator.
   *
   * @param SourceMapGenerator aSourceMap
   *        The source map that will be consumed.
   * @returns SourceMapConsumer
   */
  SourceMapConsumer.fromSourceMap =
    function SourceMapConsumer_fromSourceMap(aSourceMap) {
      var smc = Object.create(SourceMapConsumer.prototype);

      smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
      smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
      smc.sourceRoot = aSourceMap._sourceRoot;
      smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                              smc.sourceRoot);
      smc.file = aSourceMap._file;

      smc.__generatedMappings = aSourceMap._mappings.slice()
        .sort(util.compareByGeneratedPositions);
      smc.__originalMappings = aSourceMap._mappings.slice()
        .sort(util.compareByOriginalPositions);

      return smc;
    };

  /**
   * The version of the source mapping spec that we are consuming.
   */
  SourceMapConsumer.prototype._version = 3;

  /**
   * The list of original sources.
   */
  Object.defineProperty(SourceMapConsumer.prototype, 'sources', {
    get: function () {
      return this._sources.toArray().map(function (s) {
        return this.sourceRoot ? util.join(this.sourceRoot, s) : s;
      }, this);
    }
  });

  // `__generatedMappings` and `__originalMappings` are arrays that hold the
  // parsed mapping coordinates from the source map's "mappings" attribute. They
  // are lazily instantiated, accessed via the `_generatedMappings` and
  // `_originalMappings` getters respectively, and we only parse the mappings
  // and create these arrays once queried for a source location. We jump through
  // these hoops because there can be many thousands of mappings, and parsing
  // them is expensive, so we only want to do it if we must.
  //
  // Each object in the arrays is of the form:
  //
  //     {
  //       generatedLine: The line number in the generated code,
  //       generatedColumn: The column number in the generated code,
  //       source: The path to the original source file that generated this
  //               chunk of code,
  //       originalLine: The line number in the original source that
  //                     corresponds to this chunk of generated code,
  //       originalColumn: The column number in the original source that
  //                       corresponds to this chunk of generated code,
  //       name: The name of the original symbol which generated this chunk of
  //             code.
  //     }
  //
  // All properties except for `generatedLine` and `generatedColumn` can be
  // `null`.
  //
  // `_generatedMappings` is ordered by the generated positions.
  //
  // `_originalMappings` is ordered by the original positions.

  SourceMapConsumer.prototype.__generatedMappings = null;
  Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
    get: function () {
      if (!this.__generatedMappings) {
        this.__generatedMappings = [];
        this.__originalMappings = [];
        this._parseMappings(this._mappings, this.sourceRoot);
      }

      return this.__generatedMappings;
    }
  });

  SourceMapConsumer.prototype.__originalMappings = null;
  Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
    get: function () {
      if (!this.__originalMappings) {
        this.__generatedMappings = [];
        this.__originalMappings = [];
        this._parseMappings(this._mappings, this.sourceRoot);
      }

      return this.__originalMappings;
    }
  });

  /**
   * Parse the mappings in a string in to a data structure which we can easily
   * query (the ordered arrays in the `this.__generatedMappings` and
   * `this.__originalMappings` properties).
   */
  SourceMapConsumer.prototype._parseMappings =
    function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      var generatedLine = 1;
      var previousGeneratedColumn = 0;
      var previousOriginalLine = 0;
      var previousOriginalColumn = 0;
      var previousSource = 0;
      var previousName = 0;
      var mappingSeparator = /^[,;]/;
      var str = aStr;
      var mapping;
      var temp;

      while (str.length > 0) {
        if (str.charAt(0) === ';') {
          generatedLine++;
          str = str.slice(1);
          previousGeneratedColumn = 0;
        }
        else if (str.charAt(0) === ',') {
          str = str.slice(1);
        }
        else {
          mapping = {};
          mapping.generatedLine = generatedLine;

          // Generated column.
          temp = base64VLQ.decode(str);
          mapping.generatedColumn = previousGeneratedColumn + temp.value;
          previousGeneratedColumn = mapping.generatedColumn;
          str = temp.rest;

          if (str.length > 0 && !mappingSeparator.test(str.charAt(0))) {
            // Original source.
            temp = base64VLQ.decode(str);
            mapping.source = this._sources.at(previousSource + temp.value);
            previousSource += temp.value;
            str = temp.rest;
            if (str.length === 0 || mappingSeparator.test(str.charAt(0))) {
              throw new Error('Found a source, but no line and column');
            }

            // Original line.
            temp = base64VLQ.decode(str);
            mapping.originalLine = previousOriginalLine + temp.value;
            previousOriginalLine = mapping.originalLine;
            // Lines are stored 0-based
            mapping.originalLine += 1;
            str = temp.rest;
            if (str.length === 0 || mappingSeparator.test(str.charAt(0))) {
              throw new Error('Found a source and line, but no column');
            }

            // Original column.
            temp = base64VLQ.decode(str);
            mapping.originalColumn = previousOriginalColumn + temp.value;
            previousOriginalColumn = mapping.originalColumn;
            str = temp.rest;

            if (str.length > 0 && !mappingSeparator.test(str.charAt(0))) {
              // Original name.
              temp = base64VLQ.decode(str);
              mapping.name = this._names.at(previousName + temp.value);
              previousName += temp.value;
              str = temp.rest;
            }
          }

          this.__generatedMappings.push(mapping);
          if (typeof mapping.originalLine === 'number') {
            this.__originalMappings.push(mapping);
          }
        }
      }

      this.__originalMappings.sort(util.compareByOriginalPositions);
    };

  /**
   * Find the mapping that best matches the hypothetical "needle" mapping that
   * we are searching for in the given "haystack" of mappings.
   */
  SourceMapConsumer.prototype._findMapping =
    function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                           aColumnName, aComparator) {
      // To return the position we are searching for, we must first find the
      // mapping for the given position and then return the opposite position it
      // points to. Because the mappings are sorted, we can use binary search to
      // find the best mapping.

      if (aNeedle[aLineName] <= 0) {
        throw new TypeError('Line must be greater than or equal to 1, got '
                            + aNeedle[aLineName]);
      }
      if (aNeedle[aColumnName] < 0) {
        throw new TypeError('Column must be greater than or equal to 0, got '
                            + aNeedle[aColumnName]);
      }

      return binarySearch.search(aNeedle, aMappings, aComparator);
    };

  /**
   * Returns the original source, line, and column information for the generated
   * source's line and column positions provided. The only argument is an object
   * with the following properties:
   *
   *   - line: The line number in the generated source.
   *   - column: The column number in the generated source.
   *
   * and an object is returned with the following properties:
   *
   *   - source: The original source file, or null.
   *   - line: The line number in the original source, or null.
   *   - column: The column number in the original source, or null.
   *   - name: The original identifier, or null.
   */
  SourceMapConsumer.prototype.originalPositionFor =
    function SourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util.getArg(aArgs, 'line'),
        generatedColumn: util.getArg(aArgs, 'column')
      };

      var mapping = this._findMapping(needle,
                                      this._generatedMappings,
                                      "generatedLine",
                                      "generatedColumn",
                                      util.compareByGeneratedPositions);

      if (mapping) {
        var source = util.getArg(mapping, 'source', null);
        if (source && this.sourceRoot) {
          source = util.join(this.sourceRoot, source);
        }
        return {
          source: source,
          line: util.getArg(mapping, 'originalLine', null),
          column: util.getArg(mapping, 'originalColumn', null),
          name: util.getArg(mapping, 'name', null)
        };
      }

      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    };

  /**
   * Returns the original source content. The only argument is the url of the
   * original source file. Returns null if no original source content is
   * availible.
   */
  SourceMapConsumer.prototype.sourceContentFor =
    function SourceMapConsumer_sourceContentFor(aSource) {
      if (!this.sourcesContent) {
        return null;
      }

      if (this.sourceRoot) {
        aSource = util.relative(this.sourceRoot, aSource);
      }

      if (this._sources.has(aSource)) {
        return this.sourcesContent[this._sources.indexOf(aSource)];
      }

      var url;
      if (this.sourceRoot
          && (url = util.urlParse(this.sourceRoot))) {
        // XXX: file:// URIs and absolute paths lead to unexpected behavior for
        // many users. We can help them out when they expect file:// URIs to
        // behave like it would if they were running a local HTTP server. See
        // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
        var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
        if (url.scheme == "file"
            && this._sources.has(fileUriAbsPath)) {
          return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
        }

        if ((!url.path || url.path == "/")
            && this._sources.has("/" + aSource)) {
          return this.sourcesContent[this._sources.indexOf("/" + aSource)];
        }
      }

      throw new Error('"' + aSource + '" is not in the SourceMap.');
    };

  /**
   * Returns the generated line and column information for the original source,
   * line, and column positions provided. The only argument is an object with
   * the following properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.
   *   - column: The column number in the original source.
   *
   * and an object is returned with the following properties:
   *
   *   - line: The line number in the generated source, or null.
   *   - column: The column number in the generated source, or null.
   */
  SourceMapConsumer.prototype.generatedPositionFor =
    function SourceMapConsumer_generatedPositionFor(aArgs) {
      var needle = {
        source: util.getArg(aArgs, 'source'),
        originalLine: util.getArg(aArgs, 'line'),
        originalColumn: util.getArg(aArgs, 'column')
      };

      if (this.sourceRoot) {
        needle.source = util.relative(this.sourceRoot, needle.source);
      }

      var mapping = this._findMapping(needle,
                                      this._originalMappings,
                                      "originalLine",
                                      "originalColumn",
                                      util.compareByOriginalPositions);

      if (mapping) {
        return {
          line: util.getArg(mapping, 'generatedLine', null),
          column: util.getArg(mapping, 'generatedColumn', null)
        };
      }

      return {
        line: null,
        column: null
      };
    };

  SourceMapConsumer.GENERATED_ORDER = 1;
  SourceMapConsumer.ORIGINAL_ORDER = 2;

  /**
   * Iterate over each mapping between an original source/line/column and a
   * generated line/column in this source map.
   *
   * @param Function aCallback
   *        The function that is called with each mapping.
   * @param Object aContext
   *        Optional. If specified, this object will be the value of `this` every
   *        time that `aCallback` is called.
   * @param aOrder
   *        Either `SourceMapConsumer.GENERATED_ORDER` or
   *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
   *        iterate over the mappings sorted by the generated file's line/column
   *        order or the original's source/line/column order, respectively. Defaults to
   *        `SourceMapConsumer.GENERATED_ORDER`.
   */
  SourceMapConsumer.prototype.eachMapping =
    function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
      var context = aContext || null;
      var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

      var mappings;
      switch (order) {
      case SourceMapConsumer.GENERATED_ORDER:
        mappings = this._generatedMappings;
        break;
      case SourceMapConsumer.ORIGINAL_ORDER:
        mappings = this._originalMappings;
        break;
      default:
        throw new Error("Unknown order of iteration.");
      }

      var sourceRoot = this.sourceRoot;
      mappings.map(function (mapping) {
        var source = mapping.source;
        if (source && sourceRoot) {
          source = util.join(sourceRoot, source);
        }
        return {
          source: source,
          generatedLine: mapping.generatedLine,
          generatedColumn: mapping.generatedColumn,
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: mapping.name
        };
      }).forEach(aCallback, context);
    };

  exports.SourceMapConsumer = SourceMapConsumer;

});

},{"./array-set":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/array-set.js","./base64-vlq":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/base64-vlq.js","./binary-search":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/binary-search.js","./util":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/util.js","amdefine":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/node_modules/amdefine/amdefine.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/source-map-generator.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var base64VLQ = require('./base64-vlq');
  var util = require('./util');
  var ArraySet = require('./array-set').ArraySet;

  /**
   * An instance of the SourceMapGenerator represents a source map which is
   * being built incrementally. To create a new one, you must pass an object
   * with the following properties:
   *
   *   - file: The filename of the generated source.
   *   - sourceRoot: An optional root for all URLs in this source map.
   */
  function SourceMapGenerator(aArgs) {
    this._file = util.getArg(aArgs, 'file');
    this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
    this._sources = new ArraySet();
    this._names = new ArraySet();
    this._mappings = [];
    this._sourcesContents = null;
  }

  SourceMapGenerator.prototype._version = 3;

  /**
   * Creates a new SourceMapGenerator based on a SourceMapConsumer
   *
   * @param aSourceMapConsumer The SourceMap.
   */
  SourceMapGenerator.fromSourceMap =
    function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
      var sourceRoot = aSourceMapConsumer.sourceRoot;
      var generator = new SourceMapGenerator({
        file: aSourceMapConsumer.file,
        sourceRoot: sourceRoot
      });
      aSourceMapConsumer.eachMapping(function (mapping) {
        var newMapping = {
          generated: {
            line: mapping.generatedLine,
            column: mapping.generatedColumn
          }
        };

        if (mapping.source) {
          newMapping.source = mapping.source;
          if (sourceRoot) {
            newMapping.source = util.relative(sourceRoot, newMapping.source);
          }

          newMapping.original = {
            line: mapping.originalLine,
            column: mapping.originalColumn
          };

          if (mapping.name) {
            newMapping.name = mapping.name;
          }
        }

        generator.addMapping(newMapping);
      });
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content) {
          generator.setSourceContent(sourceFile, content);
        }
      });
      return generator;
    };

  /**
   * Add a single mapping from original source line and column to the generated
   * source's line and column for this source map being created. The mapping
   * object should have the following properties:
   *
   *   - generated: An object with the generated line and column positions.
   *   - original: An object with the original line and column positions.
   *   - source: The original source file (relative to the sourceRoot).
   *   - name: An optional original token name for this mapping.
   */
  SourceMapGenerator.prototype.addMapping =
    function SourceMapGenerator_addMapping(aArgs) {
      var generated = util.getArg(aArgs, 'generated');
      var original = util.getArg(aArgs, 'original', null);
      var source = util.getArg(aArgs, 'source', null);
      var name = util.getArg(aArgs, 'name', null);

      this._validateMapping(generated, original, source, name);

      if (source && !this._sources.has(source)) {
        this._sources.add(source);
      }

      if (name && !this._names.has(name)) {
        this._names.add(name);
      }

      this._mappings.push({
        generatedLine: generated.line,
        generatedColumn: generated.column,
        originalLine: original != null && original.line,
        originalColumn: original != null && original.column,
        source: source,
        name: name
      });
    };

  /**
   * Set the source content for a source file.
   */
  SourceMapGenerator.prototype.setSourceContent =
    function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
      var source = aSourceFile;
      if (this._sourceRoot) {
        source = util.relative(this._sourceRoot, source);
      }

      if (aSourceContent !== null) {
        // Add the source content to the _sourcesContents map.
        // Create a new _sourcesContents map if the property is null.
        if (!this._sourcesContents) {
          this._sourcesContents = {};
        }
        this._sourcesContents[util.toSetString(source)] = aSourceContent;
      } else {
        // Remove the source file from the _sourcesContents map.
        // If the _sourcesContents map is empty, set the property to null.
        delete this._sourcesContents[util.toSetString(source)];
        if (Object.keys(this._sourcesContents).length === 0) {
          this._sourcesContents = null;
        }
      }
    };

  /**
   * Applies the mappings of a sub-source-map for a specific source file to the
   * source map being generated. Each mapping to the supplied source file is
   * rewritten using the supplied source map. Note: The resolution for the
   * resulting mappings is the minimium of this map and the supplied map.
   *
   * @param aSourceMapConsumer The source map to be applied.
   * @param aSourceFile Optional. The filename of the source file.
   *        If omitted, SourceMapConsumer's file property will be used.
   */
  SourceMapGenerator.prototype.applySourceMap =
    function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile) {
      // If aSourceFile is omitted, we will use the file property of the SourceMap
      if (!aSourceFile) {
        aSourceFile = aSourceMapConsumer.file;
      }
      var sourceRoot = this._sourceRoot;
      // Make "aSourceFile" relative if an absolute Url is passed.
      if (sourceRoot) {
        aSourceFile = util.relative(sourceRoot, aSourceFile);
      }
      // Applying the SourceMap can add and remove items from the sources and
      // the names array.
      var newSources = new ArraySet();
      var newNames = new ArraySet();

      // Find mappings for the "aSourceFile"
      this._mappings.forEach(function (mapping) {
        if (mapping.source === aSourceFile && mapping.originalLine) {
          // Check if it can be mapped by the source map, then update the mapping.
          var original = aSourceMapConsumer.originalPositionFor({
            line: mapping.originalLine,
            column: mapping.originalColumn
          });
          if (original.source !== null) {
            // Copy mapping
            if (sourceRoot) {
              mapping.source = util.relative(sourceRoot, original.source);
            } else {
              mapping.source = original.source;
            }
            mapping.originalLine = original.line;
            mapping.originalColumn = original.column;
            if (original.name !== null && mapping.name !== null) {
              // Only use the identifier name if it's an identifier
              // in both SourceMaps
              mapping.name = original.name;
            }
          }
        }

        var source = mapping.source;
        if (source && !newSources.has(source)) {
          newSources.add(source);
        }

        var name = mapping.name;
        if (name && !newNames.has(name)) {
          newNames.add(name);
        }

      }, this);
      this._sources = newSources;
      this._names = newNames;

      // Copy sourcesContents of applied map.
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content) {
          if (sourceRoot) {
            sourceFile = util.relative(sourceRoot, sourceFile);
          }
          this.setSourceContent(sourceFile, content);
        }
      }, this);
    };

  /**
   * A mapping can have one of the three levels of data:
   *
   *   1. Just the generated position.
   *   2. The Generated position, original position, and original source.
   *   3. Generated and original position, original source, as well as a name
   *      token.
   *
   * To maintain consistency, we validate that any new mapping being added falls
   * in to one of these categories.
   */
  SourceMapGenerator.prototype._validateMapping =
    function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                                aName) {
      if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
          && aGenerated.line > 0 && aGenerated.column >= 0
          && !aOriginal && !aSource && !aName) {
        // Case 1.
        return;
      }
      else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
               && aOriginal && 'line' in aOriginal && 'column' in aOriginal
               && aGenerated.line > 0 && aGenerated.column >= 0
               && aOriginal.line > 0 && aOriginal.column >= 0
               && aSource) {
        // Cases 2 and 3.
        return;
      }
      else {
        throw new Error('Invalid mapping: ' + JSON.stringify({
          generated: aGenerated,
          source: aSource,
          orginal: aOriginal,
          name: aName
        }));
      }
    };

  /**
   * Serialize the accumulated mappings in to the stream of base 64 VLQs
   * specified by the source map format.
   */
  SourceMapGenerator.prototype._serializeMappings =
    function SourceMapGenerator_serializeMappings() {
      var previousGeneratedColumn = 0;
      var previousGeneratedLine = 1;
      var previousOriginalColumn = 0;
      var previousOriginalLine = 0;
      var previousName = 0;
      var previousSource = 0;
      var result = '';
      var mapping;

      // The mappings must be guaranteed to be in sorted order before we start
      // serializing them or else the generated line numbers (which are defined
      // via the ';' separators) will be all messed up. Note: it might be more
      // performant to maintain the sorting as we insert them, rather than as we
      // serialize them, but the big O is the same either way.
      this._mappings.sort(util.compareByGeneratedPositions);

      for (var i = 0, len = this._mappings.length; i < len; i++) {
        mapping = this._mappings[i];

        if (mapping.generatedLine !== previousGeneratedLine) {
          previousGeneratedColumn = 0;
          while (mapping.generatedLine !== previousGeneratedLine) {
            result += ';';
            previousGeneratedLine++;
          }
        }
        else {
          if (i > 0) {
            if (!util.compareByGeneratedPositions(mapping, this._mappings[i - 1])) {
              continue;
            }
            result += ',';
          }
        }

        result += base64VLQ.encode(mapping.generatedColumn
                                   - previousGeneratedColumn);
        previousGeneratedColumn = mapping.generatedColumn;

        if (mapping.source) {
          result += base64VLQ.encode(this._sources.indexOf(mapping.source)
                                     - previousSource);
          previousSource = this._sources.indexOf(mapping.source);

          // lines are stored 0-based in SourceMap spec version 3
          result += base64VLQ.encode(mapping.originalLine - 1
                                     - previousOriginalLine);
          previousOriginalLine = mapping.originalLine - 1;

          result += base64VLQ.encode(mapping.originalColumn
                                     - previousOriginalColumn);
          previousOriginalColumn = mapping.originalColumn;

          if (mapping.name) {
            result += base64VLQ.encode(this._names.indexOf(mapping.name)
                                       - previousName);
            previousName = this._names.indexOf(mapping.name);
          }
        }
      }

      return result;
    };

  SourceMapGenerator.prototype._generateSourcesContent =
    function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
      return aSources.map(function (source) {
        if (!this._sourcesContents) {
          return null;
        }
        if (aSourceRoot) {
          source = util.relative(aSourceRoot, source);
        }
        var key = util.toSetString(source);
        return Object.prototype.hasOwnProperty.call(this._sourcesContents,
                                                    key)
          ? this._sourcesContents[key]
          : null;
      }, this);
    };

  /**
   * Externalize the source map.
   */
  SourceMapGenerator.prototype.toJSON =
    function SourceMapGenerator_toJSON() {
      var map = {
        version: this._version,
        file: this._file,
        sources: this._sources.toArray(),
        names: this._names.toArray(),
        mappings: this._serializeMappings()
      };
      if (this._sourceRoot) {
        map.sourceRoot = this._sourceRoot;
      }
      if (this._sourcesContents) {
        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
      }

      return map;
    };

  /**
   * Render the source map being generated to a string.
   */
  SourceMapGenerator.prototype.toString =
    function SourceMapGenerator_toString() {
      return JSON.stringify(this);
    };

  exports.SourceMapGenerator = SourceMapGenerator;

});

},{"./array-set":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/array-set.js","./base64-vlq":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/base64-vlq.js","./util":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/util.js","amdefine":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/node_modules/amdefine/amdefine.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/source-node.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var SourceMapGenerator = require('./source-map-generator').SourceMapGenerator;
  var util = require('./util');

  /**
   * SourceNodes provide a way to abstract over interpolating/concatenating
   * snippets of generated JavaScript source code while maintaining the line and
   * column information associated with the original source code.
   *
   * @param aLine The original line number.
   * @param aColumn The original column number.
   * @param aSource The original source's filename.
   * @param aChunks Optional. An array of strings which are snippets of
   *        generated JS, or other SourceNodes.
   * @param aName The original identifier.
   */
  function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
    this.children = [];
    this.sourceContents = {};
    this.line = aLine === undefined ? null : aLine;
    this.column = aColumn === undefined ? null : aColumn;
    this.source = aSource === undefined ? null : aSource;
    this.name = aName === undefined ? null : aName;
    if (aChunks != null) this.add(aChunks);
  }

  /**
   * Creates a SourceNode from generated code and a SourceMapConsumer.
   *
   * @param aGeneratedCode The generated code
   * @param aSourceMapConsumer The SourceMap for the generated code
   */
  SourceNode.fromStringWithSourceMap =
    function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer) {
      // The SourceNode we want to fill with the generated code
      // and the SourceMap
      var node = new SourceNode();

      // The generated code
      // Processed fragments are removed from this array.
      var remainingLines = aGeneratedCode.split('\n');

      // We need to remember the position of "remainingLines"
      var lastGeneratedLine = 1, lastGeneratedColumn = 0;

      // The generate SourceNodes we need a code range.
      // To extract it current and last mapping is used.
      // Here we store the last mapping.
      var lastMapping = null;

      aSourceMapConsumer.eachMapping(function (mapping) {
        if (lastMapping === null) {
          // We add the generated code until the first mapping
          // to the SourceNode without any mapping.
          // Each line is added as separate string.
          while (lastGeneratedLine < mapping.generatedLine) {
            node.add(remainingLines.shift() + "\n");
            lastGeneratedLine++;
          }
          if (lastGeneratedColumn < mapping.generatedColumn) {
            var nextLine = remainingLines[0];
            node.add(nextLine.substr(0, mapping.generatedColumn));
            remainingLines[0] = nextLine.substr(mapping.generatedColumn);
            lastGeneratedColumn = mapping.generatedColumn;
          }
        } else {
          // We add the code from "lastMapping" to "mapping":
          // First check if there is a new line in between.
          if (lastGeneratedLine < mapping.generatedLine) {
            var code = "";
            // Associate full lines with "lastMapping"
            do {
              code += remainingLines.shift() + "\n";
              lastGeneratedLine++;
              lastGeneratedColumn = 0;
            } while (lastGeneratedLine < mapping.generatedLine);
            // When we reached the correct line, we add code until we
            // reach the correct column too.
            if (lastGeneratedColumn < mapping.generatedColumn) {
              var nextLine = remainingLines[0];
              code += nextLine.substr(0, mapping.generatedColumn);
              remainingLines[0] = nextLine.substr(mapping.generatedColumn);
              lastGeneratedColumn = mapping.generatedColumn;
            }
            // Create the SourceNode.
            addMappingWithCode(lastMapping, code);
          } else {
            // There is no new line in between.
            // Associate the code between "lastGeneratedColumn" and
            // "mapping.generatedColumn" with "lastMapping"
            var nextLine = remainingLines[0];
            var code = nextLine.substr(0, mapping.generatedColumn -
                                          lastGeneratedColumn);
            remainingLines[0] = nextLine.substr(mapping.generatedColumn -
                                                lastGeneratedColumn);
            lastGeneratedColumn = mapping.generatedColumn;
            addMappingWithCode(lastMapping, code);
          }
        }
        lastMapping = mapping;
      }, this);
      // We have processed all mappings.
      // Associate the remaining code in the current line with "lastMapping"
      // and add the remaining lines without any mapping
      addMappingWithCode(lastMapping, remainingLines.join("\n"));

      // Copy sourcesContent into SourceNode
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content) {
          node.setSourceContent(sourceFile, content);
        }
      });

      return node;

      function addMappingWithCode(mapping, code) {
        if (mapping === null || mapping.source === undefined) {
          node.add(code);
        } else {
          node.add(new SourceNode(mapping.originalLine,
                                  mapping.originalColumn,
                                  mapping.source,
                                  code,
                                  mapping.name));
        }
      }
    };

  /**
   * Add a chunk of generated JS to this source node.
   *
   * @param aChunk A string snippet of generated JS code, another instance of
   *        SourceNode, or an array where each member is one of those things.
   */
  SourceNode.prototype.add = function SourceNode_add(aChunk) {
    if (Array.isArray(aChunk)) {
      aChunk.forEach(function (chunk) {
        this.add(chunk);
      }, this);
    }
    else if (aChunk instanceof SourceNode || typeof aChunk === "string") {
      if (aChunk) {
        this.children.push(aChunk);
      }
    }
    else {
      throw new TypeError(
        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
      );
    }
    return this;
  };

  /**
   * Add a chunk of generated JS to the beginning of this source node.
   *
   * @param aChunk A string snippet of generated JS code, another instance of
   *        SourceNode, or an array where each member is one of those things.
   */
  SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
    if (Array.isArray(aChunk)) {
      for (var i = aChunk.length-1; i >= 0; i--) {
        this.prepend(aChunk[i]);
      }
    }
    else if (aChunk instanceof SourceNode || typeof aChunk === "string") {
      this.children.unshift(aChunk);
    }
    else {
      throw new TypeError(
        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
      );
    }
    return this;
  };

  /**
   * Walk over the tree of JS snippets in this node and its children. The
   * walking function is called once for each snippet of JS and is passed that
   * snippet and the its original associated source's line/column location.
   *
   * @param aFn The traversal function.
   */
  SourceNode.prototype.walk = function SourceNode_walk(aFn) {
    var chunk;
    for (var i = 0, len = this.children.length; i < len; i++) {
      chunk = this.children[i];
      if (chunk instanceof SourceNode) {
        chunk.walk(aFn);
      }
      else {
        if (chunk !== '') {
          aFn(chunk, { source: this.source,
                       line: this.line,
                       column: this.column,
                       name: this.name });
        }
      }
    }
  };

  /**
   * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
   * each of `this.children`.
   *
   * @param aSep The separator.
   */
  SourceNode.prototype.join = function SourceNode_join(aSep) {
    var newChildren;
    var i;
    var len = this.children.length;
    if (len > 0) {
      newChildren = [];
      for (i = 0; i < len-1; i++) {
        newChildren.push(this.children[i]);
        newChildren.push(aSep);
      }
      newChildren.push(this.children[i]);
      this.children = newChildren;
    }
    return this;
  };

  /**
   * Call String.prototype.replace on the very right-most source snippet. Useful
   * for trimming whitespace from the end of a source node, etc.
   *
   * @param aPattern The pattern to replace.
   * @param aReplacement The thing to replace the pattern with.
   */
  SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
    var lastChild = this.children[this.children.length - 1];
    if (lastChild instanceof SourceNode) {
      lastChild.replaceRight(aPattern, aReplacement);
    }
    else if (typeof lastChild === 'string') {
      this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
    }
    else {
      this.children.push(''.replace(aPattern, aReplacement));
    }
    return this;
  };

  /**
   * Set the source content for a source file. This will be added to the SourceMapGenerator
   * in the sourcesContent field.
   *
   * @param aSourceFile The filename of the source file
   * @param aSourceContent The content of the source file
   */
  SourceNode.prototype.setSourceContent =
    function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
      this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
    };

  /**
   * Walk over the tree of SourceNodes. The walking function is called for each
   * source file content and is passed the filename and source content.
   *
   * @param aFn The traversal function.
   */
  SourceNode.prototype.walkSourceContents =
    function SourceNode_walkSourceContents(aFn) {
      for (var i = 0, len = this.children.length; i < len; i++) {
        if (this.children[i] instanceof SourceNode) {
          this.children[i].walkSourceContents(aFn);
        }
      }

      var sources = Object.keys(this.sourceContents);
      for (var i = 0, len = sources.length; i < len; i++) {
        aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
      }
    };

  /**
   * Return the string representation of this source node. Walks over the tree
   * and concatenates all the various snippets together to one string.
   */
  SourceNode.prototype.toString = function SourceNode_toString() {
    var str = "";
    this.walk(function (chunk) {
      str += chunk;
    });
    return str;
  };

  /**
   * Returns the string representation of this source node along with a source
   * map.
   */
  SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
    var generated = {
      code: "",
      line: 1,
      column: 0
    };
    var map = new SourceMapGenerator(aArgs);
    var sourceMappingActive = false;
    var lastOriginalSource = null;
    var lastOriginalLine = null;
    var lastOriginalColumn = null;
    var lastOriginalName = null;
    this.walk(function (chunk, original) {
      generated.code += chunk;
      if (original.source !== null
          && original.line !== null
          && original.column !== null) {
        if(lastOriginalSource !== original.source
           || lastOriginalLine !== original.line
           || lastOriginalColumn !== original.column
           || lastOriginalName !== original.name) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
        lastOriginalSource = original.source;
        lastOriginalLine = original.line;
        lastOriginalColumn = original.column;
        lastOriginalName = original.name;
        sourceMappingActive = true;
      } else if (sourceMappingActive) {
        map.addMapping({
          generated: {
            line: generated.line,
            column: generated.column
          }
        });
        lastOriginalSource = null;
        sourceMappingActive = false;
      }
      chunk.split('').forEach(function (ch) {
        if (ch === '\n') {
          generated.line++;
          generated.column = 0;
        } else {
          generated.column++;
        }
      });
    });
    this.walkSourceContents(function (sourceFile, sourceContent) {
      map.setSourceContent(sourceFile, sourceContent);
    });

    return { code: generated.code, map: map };
  };

  exports.SourceNode = SourceNode;

});

},{"./source-map-generator":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/source-map-generator.js","./util":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/util.js","amdefine":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/node_modules/amdefine/amdefine.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map/util.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  /**
   * This is a helper function for getting values from parameter/options
   * objects.
   *
   * @param args The object we are extracting values from
   * @param name The name of the property we are getting.
   * @param defaultValue An optional value to return if the property is missing
   * from the object. If this is not specified and the property is missing, an
   * error will be thrown.
   */
  function getArg(aArgs, aName, aDefaultValue) {
    if (aName in aArgs) {
      return aArgs[aName];
    } else if (arguments.length === 3) {
      return aDefaultValue;
    } else {
      throw new Error('"' + aName + '" is a required argument.');
    }
  }
  exports.getArg = getArg;

  var urlRegexp = /([\w+\-.]+):\/\/((\w+:\w+)@)?([\w.]+)?(:(\d+))?(\S+)?/;
  var dataUrlRegexp = /^data:.+\,.+/;

  function urlParse(aUrl) {
    var match = aUrl.match(urlRegexp);
    if (!match) {
      return null;
    }
    return {
      scheme: match[1],
      auth: match[3],
      host: match[4],
      port: match[6],
      path: match[7]
    };
  }
  exports.urlParse = urlParse;

  function urlGenerate(aParsedUrl) {
    var url = aParsedUrl.scheme + "://";
    if (aParsedUrl.auth) {
      url += aParsedUrl.auth + "@"
    }
    if (aParsedUrl.host) {
      url += aParsedUrl.host;
    }
    if (aParsedUrl.port) {
      url += ":" + aParsedUrl.port
    }
    if (aParsedUrl.path) {
      url += aParsedUrl.path;
    }
    return url;
  }
  exports.urlGenerate = urlGenerate;

  function join(aRoot, aPath) {
    var url;

    if (aPath.match(urlRegexp) || aPath.match(dataUrlRegexp)) {
      return aPath;
    }

    if (aPath.charAt(0) === '/' && (url = urlParse(aRoot))) {
      url.path = aPath;
      return urlGenerate(url);
    }

    return aRoot.replace(/\/$/, '') + '/' + aPath;
  }
  exports.join = join;

  /**
   * Because behavior goes wacky when you set `__proto__` on objects, we
   * have to prefix all the strings in our set with an arbitrary character.
   *
   * See https://github.com/mozilla/source-map/pull/31 and
   * https://github.com/mozilla/source-map/issues/30
   *
   * @param String aStr
   */
  function toSetString(aStr) {
    return '$' + aStr;
  }
  exports.toSetString = toSetString;

  function fromSetString(aStr) {
    return aStr.substr(1);
  }
  exports.fromSetString = fromSetString;

  function relative(aRoot, aPath) {
    aRoot = aRoot.replace(/\/$/, '');

    var url = urlParse(aRoot);
    if (aPath.charAt(0) == "/" && url && url.path == "/") {
      return aPath.slice(1);
    }

    return aPath.indexOf(aRoot + '/') === 0
      ? aPath.substr(aRoot.length + 1)
      : aPath;
  }
  exports.relative = relative;

  function strcmp(aStr1, aStr2) {
    var s1 = aStr1 || "";
    var s2 = aStr2 || "";
    return (s1 > s2) - (s1 < s2);
  }

  /**
   * Comparator between two mappings where the original positions are compared.
   *
   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
   * mappings with the same original source/line/column, but different generated
   * line and column the same. Useful when searching for a mapping with a
   * stubbed out mapping.
   */
  function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
    var cmp;

    cmp = strcmp(mappingA.source, mappingB.source);
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp || onlyCompareOriginal) {
      return cmp;
    }

    cmp = strcmp(mappingA.name, mappingB.name);
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp) {
      return cmp;
    }

    return mappingA.generatedColumn - mappingB.generatedColumn;
  };
  exports.compareByOriginalPositions = compareByOriginalPositions;

  /**
   * Comparator between two mappings where the generated positions are
   * compared.
   *
   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
   * mappings with the same generated line and column, but different
   * source/name/original line and column the same. Useful when searching for a
   * mapping with a stubbed out mapping.
   */
  function compareByGeneratedPositions(mappingA, mappingB, onlyCompareGenerated) {
    var cmp;

    cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
    if (cmp || onlyCompareGenerated) {
      return cmp;
    }

    cmp = strcmp(mappingA.source, mappingB.source);
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp) {
      return cmp;
    }

    return strcmp(mappingA.name, mappingB.name);
  };
  exports.compareByGeneratedPositions = compareByGeneratedPositions;

});

},{"amdefine":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/node_modules/amdefine/amdefine.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/node_modules/amdefine/amdefine.js":[function(require,module,exports){
(function (process,__filename){
/** vim: et:ts=4:sw=4:sts=4
 * @license amdefine 0.1.0 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/amdefine for details
 */

/*jslint node: true */
/*global module, process */
'use strict';

/**
 * Creates a define for node.
 * @param {Object} module the "module" object that is defined by Node for the
 * current module.
 * @param {Function} [requireFn]. Node's require function for the current module.
 * It only needs to be passed in Node versions before 0.5, when module.require
 * did not exist.
 * @returns {Function} a define function that is usable for the current node
 * module.
 */
function amdefine(module, requireFn) {
    'use strict';
    var defineCache = {},
        loaderCache = {},
        alreadyCalled = false,
        path = require('path'),
        makeRequire, stringRequire;

    /**
     * Trims the . and .. from an array of path segments.
     * It will keep a leading path segment if a .. will become
     * the first path segment, to help with module name lookups,
     * which act like paths, but can be remapped. But the end result,
     * all paths that use this function should look normalized.
     * NOTE: this method MODIFIES the input array.
     * @param {Array} ary the array of path segments.
     */
    function trimDots(ary) {
        var i, part;
        for (i = 0; ary[i]; i+= 1) {
            part = ary[i];
            if (part === '.') {
                ary.splice(i, 1);
                i -= 1;
            } else if (part === '..') {
                if (i === 1 && (ary[2] === '..' || ary[0] === '..')) {
                    //End of the line. Keep at least one non-dot
                    //path segment at the front so it can be mapped
                    //correctly to disk. Otherwise, there is likely
                    //no path mapping for a path starting with '..'.
                    //This can still fail, but catches the most reasonable
                    //uses of ..
                    break;
                } else if (i > 0) {
                    ary.splice(i - 1, 2);
                    i -= 2;
                }
            }
        }
    }

    function normalize(name, baseName) {
        var baseParts;

        //Adjust any relative paths.
        if (name && name.charAt(0) === '.') {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                baseParts = baseName.split('/');
                baseParts = baseParts.slice(0, baseParts.length - 1);
                baseParts = baseParts.concat(name.split('/'));
                trimDots(baseParts);
                name = baseParts.join('/');
            }
        }

        return name;
    }

    /**
     * Create the normalize() function passed to a loader plugin's
     * normalize method.
     */
    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(id) {
        function load(value) {
            loaderCache[id] = value;
        }

        load.fromText = function (id, text) {
            //This one is difficult because the text can/probably uses
            //define, and any relative paths and requires should be relative
            //to that id was it would be found on disk. But this would require
            //bootstrapping a module/require fairly deeply from node core.
            //Not sure how best to go about that yet.
            throw new Error('amdefine does not implement load.fromText');
        };

        return load;
    }

    makeRequire = function (systemRequire, exports, module, relId) {
        function amdRequire(deps, callback) {
            if (typeof deps === 'string') {
                //Synchronous, single module require('')
                return stringRequire(systemRequire, exports, module, deps, relId);
            } else {
                //Array of dependencies with a callback.

                //Convert the dependencies to modules.
                deps = deps.map(function (depName) {
                    return stringRequire(systemRequire, exports, module, depName, relId);
                });

                //Wait for next tick to call back the require call.
                process.nextTick(function () {
                    callback.apply(null, deps);
                });
            }
        }

        amdRequire.toUrl = function (filePath) {
            if (filePath.indexOf('.') === 0) {
                return normalize(filePath, path.dirname(module.filename));
            } else {
                return filePath;
            }
        };

        return amdRequire;
    };

    //Favor explicit value, passed in if the module wants to support Node 0.4.
    requireFn = requireFn || function req() {
        return module.require.apply(module, arguments);
    };

    function runFactory(id, deps, factory) {
        var r, e, m, result;

        if (id) {
            e = loaderCache[id] = {};
            m = {
                id: id,
                uri: __filename,
                exports: e
            };
            r = makeRequire(requireFn, e, m, id);
        } else {
            //Only support one define call per file
            if (alreadyCalled) {
                throw new Error('amdefine with no module ID cannot be called more than once per file.');
            }
            alreadyCalled = true;

            //Use the real variables from node
            //Use module.exports for exports, since
            //the exports in here is amdefine exports.
            e = module.exports;
            m = module;
            r = makeRequire(requireFn, e, m, module.id);
        }

        //If there are dependencies, they are strings, so need
        //to convert them to dependency values.
        if (deps) {
            deps = deps.map(function (depName) {
                return r(depName);
            });
        }

        //Call the factory with the right dependencies.
        if (typeof factory === 'function') {
            result = factory.apply(m.exports, deps);
        } else {
            result = factory;
        }

        if (result !== undefined) {
            m.exports = result;
            if (id) {
                loaderCache[id] = m.exports;
            }
        }
    }

    stringRequire = function (systemRequire, exports, module, id, relId) {
        //Split the ID by a ! so that
        var index = id.indexOf('!'),
            originalId = id,
            prefix, plugin;

        if (index === -1) {
            id = normalize(id, relId);

            //Straight module lookup. If it is one of the special dependencies,
            //deal with it, otherwise, delegate to node.
            if (id === 'require') {
                return makeRequire(systemRequire, exports, module, relId);
            } else if (id === 'exports') {
                return exports;
            } else if (id === 'module') {
                return module;
            } else if (loaderCache.hasOwnProperty(id)) {
                return loaderCache[id];
            } else if (defineCache[id]) {
                runFactory.apply(null, defineCache[id]);
                return loaderCache[id];
            } else {
                if(systemRequire) {
                    return systemRequire(originalId);
                } else {
                    throw new Error('No module with ID: ' + id);
                }
            }
        } else {
            //There is a plugin in play.
            prefix = id.substring(0, index);
            id = id.substring(index + 1, id.length);

            plugin = stringRequire(systemRequire, exports, module, prefix, relId);

            if (plugin.normalize) {
                id = plugin.normalize(id, makeNormalize(relId));
            } else {
                //Normalize the ID normally.
                id = normalize(id, relId);
            }

            if (loaderCache[id]) {
                return loaderCache[id];
            } else {
                plugin.load(id, makeRequire(systemRequire, exports, module, relId), makeLoad(id), {});

                return loaderCache[id];
            }
        }
    };

    //Create a define function specific to the module asking for amdefine.
    function define(id, deps, factory) {
        if (Array.isArray(id)) {
            factory = deps;
            deps = id;
            id = undefined;
        } else if (typeof id !== 'string') {
            factory = id;
            id = deps = undefined;
        }

        if (deps && !Array.isArray(deps)) {
            factory = deps;
            deps = undefined;
        }

        if (!deps) {
            deps = ['require', 'exports', 'module'];
        }

        //Set up properties for this module. If an ID, then use
        //internal cache. If no ID, then use the external variables
        //for this node module.
        if (id) {
            //Put the module in deep freeze until there is a
            //require call for it.
            defineCache[id] = [id, deps, factory];
        } else {
            runFactory(id, deps, factory);
        }
    }

    //define.require, which has access to all the values in the
    //cache. Useful for AMD modules that all have IDs in the file,
    //but need to finally export a value to node based on one of those
    //IDs.
    define.require = function (id) {
        if (loaderCache[id]) {
            return loaderCache[id];
        }

        if (defineCache[id]) {
            runFactory.apply(null, defineCache[id]);
            return loaderCache[id];
        }
    };

    define.amd = {};

    return define;
}

module.exports = amdefine;

}).call(this,require('_process'),"/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/node_modules/amdefine/amdefine.js")
},{"_process":"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/process/browser.js","path":"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/path-browserify/index.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/docblock.js":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var docblockRe = /^\s*(\/\*\*(.|\r?\n)*?\*\/)/;
var ltrimRe = /^\s*/;
/**
 * @param {String} contents
 * @return {String}
 */
function extract(contents) {
  var match = contents.match(docblockRe);
  if (match) {
    return match[0].replace(ltrimRe, '') || '';
  }
  return '';
}


var commentStartRe = /^\/\*\*?/;
var commentEndRe = /\*+\/$/;
var wsRe = /[\t ]+/g;
var stringStartRe = /(\r?\n|^) *\*/g;
var multilineRe = /(?:^|\r?\n) *(@[^\r\n]*?) *\r?\n *([^@\r\n\s][^@\r\n]+?) *\r?\n/g;
var propertyRe = /(?:^|\r?\n) *@(\S+) *([^\r\n]*)/g;

/**
 * @param {String} contents
 * @return {Array}
 */
function parse(docblock) {
  docblock = docblock
    .replace(commentStartRe, '')
    .replace(commentEndRe, '')
    .replace(wsRe, ' ')
    .replace(stringStartRe, '$1');

  // Normalize multi-line directives
  var prev = '';
  while (prev != docblock) {
    prev = docblock;
    docblock = docblock.replace(multilineRe, "\n$1 $2\n");
  }
  docblock = docblock.trim();

  var result = [];
  var match;
  while (match = propertyRe.exec(docblock)) {
    result.push([match[1], match[2]]);
  }

  return result;
}

/**
 * Same as parse but returns an object of prop: value instead of array of paris
 * If a property appers more than once the last one will be returned
 *
 * @param {String} contents
 * @return {Object}
 */
function parseAsObject(docblock) {
  var pairs = parse(docblock);
  var result = {};
  for (var i = 0; i < pairs.length; i++) {
    result[pairs[i][0]] = pairs[i][1];
  }
  return result;
}


exports.extract = extract;
exports.parse = parse;
exports.parseAsObject = parseAsObject;

},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/jstransform.js":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/*jslint node: true*/
"use strict";

var esprima = require('esprima-fb');
var utils = require('./utils');

var getBoundaryNode = utils.getBoundaryNode;
var declareIdentInScope = utils.declareIdentInLocalScope;
var initScopeMetadata = utils.initScopeMetadata;
var Syntax = esprima.Syntax;

/**
 * @param {object} node
 * @param {object} parentNode
 * @return {boolean}
 */
function _nodeIsClosureScopeBoundary(node, parentNode) {
  if (node.type === Syntax.Program) {
    return true;
  }

  var parentIsFunction =
    parentNode.type === Syntax.FunctionDeclaration
    || parentNode.type === Syntax.FunctionExpression
    || parentNode.type === Syntax.ArrowFunctionExpression;

  return node.type === Syntax.BlockStatement && parentIsFunction;
}

function _nodeIsBlockScopeBoundary(node, parentNode) {
  if (node.type === Syntax.Program) {
    return false;
  }

  return node.type === Syntax.BlockStatement
         && parentNode.type === Syntax.CatchClause;
}

/**
 * @param {object} node
 * @param {array} path
 * @param {object} state
 */
function traverse(node, path, state) {
  // Create a scope stack entry if this is the first node we've encountered in
  // its local scope
  var parentNode = path[0];
  if (!Array.isArray(node) && state.localScope.parentNode !== parentNode) {
    if (_nodeIsClosureScopeBoundary(node, parentNode)) {
      var scopeIsStrict =
        state.scopeIsStrict
        || node.body.length > 0
           && node.body[0].type === Syntax.ExpressionStatement
           && node.body[0].expression.type === Syntax.Literal
           && node.body[0].expression.value === 'use strict';

      if (node.type === Syntax.Program) {
        state = utils.updateState(state, {
          scopeIsStrict: scopeIsStrict
        });
      } else {
        state = utils.updateState(state, {
          localScope: {
            parentNode: parentNode,
            parentScope: state.localScope,
            identifiers: {},
            tempVarIndex: 0
          },
          scopeIsStrict: scopeIsStrict
        });

        // All functions have an implicit 'arguments' object in scope
        declareIdentInScope('arguments', initScopeMetadata(node), state);

        // Include function arg identifiers in the scope boundaries of the
        // function
        if (parentNode.params.length > 0) {
          var param;
          for (var i = 0; i < parentNode.params.length; i++) {
            param = parentNode.params[i];
            if (param.type === Syntax.Identifier) {
              declareIdentInScope(
                param.name, initScopeMetadata(parentNode), state
              );
            }
          }
        }

        // Named FunctionExpressions scope their name within the body block of
        // themselves only
        if (parentNode.type === Syntax.FunctionExpression && parentNode.id) {
          var metaData =
            initScopeMetadata(parentNode, path.parentNodeslice, parentNode);
          declareIdentInScope(parentNode.id.name, metaData, state);
        }
      }

      // Traverse and find all local identifiers in this closure first to
      // account for function/variable declaration hoisting
      collectClosureIdentsAndTraverse(node, path, state);
    }

    if (_nodeIsBlockScopeBoundary(node, parentNode)) {
      state = utils.updateState(state, {
        localScope: {
          parentNode: parentNode,
          parentScope: state.localScope,
          identifiers: {}
        }
      });

      if (parentNode.type === Syntax.CatchClause) {
        declareIdentInScope(
          parentNode.param.name, initScopeMetadata(parentNode), state
        );
      }
      collectBlockIdentsAndTraverse(node, path, state);
    }
  }

  // Only catchup() before and after traversing a child node
  function traverser(node, path, state) {
    node.range && utils.catchup(node.range[0], state);
    traverse(node, path, state);
    node.range && utils.catchup(node.range[1], state);
  }

  utils.analyzeAndTraverse(walker, traverser, node, path, state);
}

function collectClosureIdentsAndTraverse(node, path, state) {
  utils.analyzeAndTraverse(
    visitLocalClosureIdentifiers,
    collectClosureIdentsAndTraverse,
    node,
    path,
    state
  );
}

function collectBlockIdentsAndTraverse(node, path, state) {
  utils.analyzeAndTraverse(
    visitLocalBlockIdentifiers,
    collectBlockIdentsAndTraverse,
    node,
    path,
    state
  );
}

function visitLocalClosureIdentifiers(node, path, state) {
  var metaData;
  switch (node.type) {
    case Syntax.FunctionExpression:
      // Function expressions don't get their names (if there is one) added to
      // the closure scope they're defined in
      return false;
    case Syntax.ClassDeclaration:
    case Syntax.ClassExpression:
    case Syntax.FunctionDeclaration:
      if (node.id) {
        metaData = initScopeMetadata(getBoundaryNode(path), path.slice(), node);
        declareIdentInScope(node.id.name, metaData, state);
      }
      return false;
    case Syntax.VariableDeclarator:
      // Variables have function-local scope
      if (path[0].kind === 'var') {
        metaData = initScopeMetadata(getBoundaryNode(path), path.slice(), node);
        declareIdentInScope(node.id.name, metaData, state);
      }
      break;
  }
}

function visitLocalBlockIdentifiers(node, path, state) {
  // TODO: Support 'let' here...maybe...one day...or something...
  if (node.type === Syntax.CatchClause) {
    return false;
  }
}

function walker(node, path, state) {
  var visitors = state.g.visitors;
  for (var i = 0; i < visitors.length; i++) {
    if (visitors[i].test(node, path, state)) {
      return visitors[i](traverse, node, path, state);
    }
  }
}

var _astCache = {};

/**
 * Applies all available transformations to the source
 * @param {array} visitors
 * @param {string} source
 * @param {?object} options
 * @return {object}
 */
function transform(visitors, source, options) {
  options = options || {};
  var ast;
  try {
    var cachedAst = _astCache[source];
    ast = cachedAst ||
      (_astCache[source] = esprima.parse(source, {
        comment: true,
        loc: true,
        range: true
      }));
    } catch (e) {
    e.message = 'Parse Error: ' + e.message;
    throw e;
  }
  var state = utils.createState(source, ast, options);
  state.g.visitors = visitors;

  if (options.sourceMap) {
    var SourceMapGenerator = require('source-map').SourceMapGenerator;
    state.g.sourceMap = new SourceMapGenerator({file: options.filename || 'transformed.js'});
  }

  traverse(ast, [], state);
  utils.catchup(source.length, state);

  var ret = {code: state.g.buffer, extra: state.g.extra};
  if (options.sourceMap) {
    ret.sourceMap = state.g.sourceMap;
    ret.sourceMapFilename =  options.filename || 'source.js';
  }
  return ret;
}

exports.transform = transform;
exports.Syntax = Syntax;

},{"./utils":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/utils.js","esprima-fb":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/esprima-fb/esprima.js","source-map":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/source-map/lib/source-map.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/utils.js":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/*jslint node: true*/
var Syntax = require('esprima-fb').Syntax;
var leadingIndentRegexp = /(^|\n)( {2}|\t)/g;
var nonWhiteRegexp = /(\S)/g;

/**
 * A `state` object represents the state of the parser. It has "local" and
 * "global" parts. Global contains parser position, source, etc. Local contains
 * scope based properties like current class name. State should contain all the
 * info required for transformation. It's the only mandatory object that is
 * being passed to every function in transform chain.
 *
 * @param  {string} source
 * @param  {object} transformOptions
 * @return {object}
 */
function createState(source, rootNode, transformOptions) {
  return {
    /**
     * A tree representing the current local scope (and its lexical scope chain)
     * Useful for tracking identifiers from parent scopes, etc.
     * @type {Object}
     */
    localScope: {
      parentNode: rootNode,
      parentScope: null,
      identifiers: {},
      tempVarIndex: 0
    },
    /**
     * The name (and, if applicable, expression) of the super class
     * @type {Object}
     */
    superClass: null,
    /**
     * The namespace to use when munging identifiers
     * @type {String}
     */
    mungeNamespace: '',
    /**
     * Ref to the node for the current MethodDefinition
     * @type {Object}
     */
    methodNode: null,
    /**
     * Ref to the node for the FunctionExpression of the enclosing
     * MethodDefinition
     * @type {Object}
     */
    methodFuncNode: null,
    /**
     * Name of the enclosing class
     * @type {String}
     */
    className: null,
    /**
     * Whether we're currently within a `strict` scope
     * @type {Bool}
     */
    scopeIsStrict: null,
    /**
     * Indentation offset
     * @type {Number}
     */
    indentBy: 0,
    /**
     * Global state (not affected by updateState)
     * @type {Object}
     */
    g: {
      /**
       * A set of general options that transformations can consider while doing
       * a transformation:
       *
       * - minify
       *   Specifies that transformation steps should do their best to minify
       *   the output source when possible. This is useful for places where
       *   minification optimizations are possible with higher-level context
       *   info than what jsxmin can provide.
       *
       *   For example, the ES6 class transform will minify munged private
       *   variables if this flag is set.
       */
      opts: transformOptions,
      /**
       * Current position in the source code
       * @type {Number}
       */
      position: 0,
      /**
       * Auxiliary data to be returned by transforms
       * @type {Object}
       */
      extra: {},
      /**
       * Buffer containing the result
       * @type {String}
       */
      buffer: '',
      /**
       * Source that is being transformed
       * @type {String}
       */
      source: source,

      /**
       * Cached parsed docblock (see getDocblock)
       * @type {object}
       */
      docblock: null,

      /**
       * Whether the thing was used
       * @type {Boolean}
       */
      tagNamespaceUsed: false,

      /**
       * If using bolt xjs transformation
       * @type {Boolean}
       */
      isBolt: undefined,

      /**
       * Whether to record source map (expensive) or not
       * @type {SourceMapGenerator|null}
       */
      sourceMap: null,

      /**
       * Filename of the file being processed. Will be returned as a source
       * attribute in the source map
       */
      sourceMapFilename: 'source.js',

      /**
       * Only when source map is used: last line in the source for which
       * source map was generated
       * @type {Number}
       */
      sourceLine: 1,

      /**
       * Only when source map is used: last line in the buffer for which
       * source map was generated
       * @type {Number}
       */
      bufferLine: 1,

      /**
       * The top-level Program AST for the original file.
       */
      originalProgramAST: null,

      sourceColumn: 0,
      bufferColumn: 0
    }
  };
}

/**
 * Updates a copy of a given state with "update" and returns an updated state.
 *
 * @param  {object} state
 * @param  {object} update
 * @return {object}
 */
function updateState(state, update) {
  var ret = Object.create(state);
  Object.keys(update).forEach(function(updatedKey) {
    ret[updatedKey] = update[updatedKey];
  });
  return ret;
}

/**
 * Given a state fill the resulting buffer from the original source up to
 * the end
 *
 * @param {number} end
 * @param {object} state
 * @param {?function} contentTransformer Optional callback to transform newly
 *                                       added content.
 */
function catchup(end, state, contentTransformer) {
  if (end < state.g.position) {
    // cannot move backwards
    return;
  }
  var source = state.g.source.substring(state.g.position, end);
  var transformed = updateIndent(source, state);
  if (state.g.sourceMap && transformed) {
    // record where we are
    state.g.sourceMap.addMapping({
      generated: { line: state.g.bufferLine, column: state.g.bufferColumn },
      original: { line: state.g.sourceLine, column: state.g.sourceColumn },
      source: state.g.sourceMapFilename
    });

    // record line breaks in transformed source
    var sourceLines = source.split('\n');
    var transformedLines = transformed.split('\n');
    // Add line break mappings between last known mapping and the end of the
    // added piece. So for the code piece
    //  (foo, bar);
    // > var x = 2;
    // > var b = 3;
    //   var c =
    // only add lines marked with ">": 2, 3.
    for (var i = 1; i < sourceLines.length - 1; i++) {
      state.g.sourceMap.addMapping({
        generated: { line: state.g.bufferLine, column: 0 },
        original: { line: state.g.sourceLine, column: 0 },
        source: state.g.sourceMapFilename
      });
      state.g.sourceLine++;
      state.g.bufferLine++;
    }
    // offset for the last piece
    if (sourceLines.length > 1) {
      state.g.sourceLine++;
      state.g.bufferLine++;
      state.g.sourceColumn = 0;
      state.g.bufferColumn = 0;
    }
    state.g.sourceColumn += sourceLines[sourceLines.length - 1].length;
    state.g.bufferColumn +=
      transformedLines[transformedLines.length - 1].length;
  }
  state.g.buffer +=
    contentTransformer ? contentTransformer(transformed) : transformed;
  state.g.position = end;
}

/**
 * Returns original source for an AST node.
 * @param {object} node
 * @param {object} state
 * @return {string}
 */
function getNodeSourceText(node, state) {
  return state.g.source.substring(node.range[0], node.range[1]);
}

function replaceNonWhite(value) {
  return value.replace(nonWhiteRegexp, ' ');
}

/**
 * Removes all non-whitespace characters
 */
function stripNonWhite(value) {
  return value.replace(nonWhiteRegexp, '');
}

/**
 * Catches up as `catchup` but replaces non-whitespace chars with spaces.
 */
function catchupWhiteOut(end, state) {
  catchup(end, state, replaceNonWhite);
}

/**
 * Catches up as `catchup` but removes all non-whitespace characters.
 */
function catchupWhiteSpace(end, state) {
  catchup(end, state, stripNonWhite);
}

/**
 * Removes all non-newline characters
 */
var reNonNewline = /[^\n]/g;
function stripNonNewline(value) {
  return value.replace(reNonNewline, function() {
    return '';
  });
}

/**
 * Catches up as `catchup` but removes all non-newline characters.
 *
 * Equivalent to appending as many newlines as there are in the original source
 * between the current position and `end`.
 */
function catchupNewlines(end, state) {
  catchup(end, state, stripNonNewline);
}


/**
 * Same as catchup but does not touch the buffer
 *
 * @param  {number} end
 * @param  {object} state
 */
function move(end, state) {
  // move the internal cursors
  if (state.g.sourceMap) {
    if (end < state.g.position) {
      state.g.position = 0;
      state.g.sourceLine = 1;
      state.g.sourceColumn = 0;
    }

    var source = state.g.source.substring(state.g.position, end);
    var sourceLines = source.split('\n');
    if (sourceLines.length > 1) {
      state.g.sourceLine += sourceLines.length - 1;
      state.g.sourceColumn = 0;
    }
    state.g.sourceColumn += sourceLines[sourceLines.length - 1].length;
  }
  state.g.position = end;
}

/**
 * Appends a string of text to the buffer
 *
 * @param {string} str
 * @param {object} state
 */
function append(str, state) {
  if (state.g.sourceMap && str) {
    state.g.sourceMap.addMapping({
      generated: { line: state.g.bufferLine, column: state.g.bufferColumn },
      original: { line: state.g.sourceLine, column: state.g.sourceColumn },
      source: state.g.sourceMapFilename
    });
    var transformedLines = str.split('\n');
    if (transformedLines.length > 1) {
      state.g.bufferLine += transformedLines.length - 1;
      state.g.bufferColumn = 0;
    }
    state.g.bufferColumn +=
      transformedLines[transformedLines.length - 1].length;
  }
  state.g.buffer += str;
}

/**
 * Update indent using state.indentBy property. Indent is measured in
 * double spaces. Updates a single line only.
 *
 * @param {string} str
 * @param {object} state
 * @return {string}
 */
function updateIndent(str, state) {
  var indentBy = state.indentBy;
  if (indentBy < 0) {
    for (var i = 0; i < -indentBy; i++) {
      str = str.replace(leadingIndentRegexp, '$1');
    }
  } else {
    for (var i = 0; i < indentBy; i++) {
      str = str.replace(leadingIndentRegexp, '$1$2$2');
    }
  }
  return str;
}

/**
 * Calculates indent from the beginning of the line until "start" or the first
 * character before start.
 * @example
 *   "  foo.bar()"
 *         ^
 *       start
 *   indent will be "  "
 *
 * @param  {number} start
 * @param  {object} state
 * @return {string}
 */
function indentBefore(start, state) {
  var end = start;
  start = start - 1;

  while (start > 0 && state.g.source[start] != '\n') {
    if (!state.g.source[start].match(/[ \t]/)) {
      end = start;
    }
    start--;
  }
  return state.g.source.substring(start + 1, end);
}

function getDocblock(state) {
  if (!state.g.docblock) {
    var docblock = require('./docblock');
    state.g.docblock =
      docblock.parseAsObject(docblock.extract(state.g.source));
  }
  return state.g.docblock;
}

function identWithinLexicalScope(identName, state, stopBeforeNode) {
  var currScope = state.localScope;
  while (currScope) {
    if (currScope.identifiers[identName] !== undefined) {
      return true;
    }

    if (stopBeforeNode && currScope.parentNode === stopBeforeNode) {
      break;
    }

    currScope = currScope.parentScope;
  }
  return false;
}

function identInLocalScope(identName, state) {
  return state.localScope.identifiers[identName] !== undefined;
}

/**
 * @param {object} boundaryNode
 * @param {?array} path
 * @return {?object} node
 */
function initScopeMetadata(boundaryNode, path, node) {
  return {
    boundaryNode: boundaryNode,
    bindingPath: path,
    bindingNode: node
  };
}

function declareIdentInLocalScope(identName, metaData, state) {
  state.localScope.identifiers[identName] = {
    boundaryNode: metaData.boundaryNode,
    path: metaData.bindingPath,
    node: metaData.bindingNode,
    state: Object.create(state)
  };
}

function getLexicalBindingMetadata(identName, state) {
  return state.localScope.identifiers[identName];
}

/**
 * Apply the given analyzer function to the current node. If the analyzer
 * doesn't return false, traverse each child of the current node using the given
 * traverser function.
 *
 * @param {function} analyzer
 * @param {function} traverser
 * @param {object} node
 * @param {array} path
 * @param {object} state
 */
function analyzeAndTraverse(analyzer, traverser, node, path, state) {
  if (node.type) {
    if (analyzer(node, path, state) === false) {
      return;
    }
    path.unshift(node);
  }

  getOrderedChildren(node).forEach(function(child) {
    traverser(child, path, state);
  });

  node.type && path.shift();
}

/**
 * It is crucial that we traverse in order, or else catchup() on a later
 * node that is processed out of order can move the buffer past a node
 * that we haven't handled yet, preventing us from modifying that node.
 *
 * This can happen when a node has multiple properties containing children.
 * For example, XJSElement nodes have `openingElement`, `closingElement` and
 * `children`. If we traverse `openingElement`, then `closingElement`, then
 * when we get to `children`, the buffer has already caught up to the end of
 * the closing element, after the children.
 *
 * This is basically a Schwartzian transform. Collects an array of children,
 * each one represented as [child, startIndex]; sorts the array by start
 * index; then traverses the children in that order.
 */
function getOrderedChildren(node) {
  var queue = [];
  for (var key in node) {
    if (node.hasOwnProperty(key)) {
      enqueueNodeWithStartIndex(queue, node[key]);
    }
  }
  queue.sort(function(a, b) { return a[1] - b[1]; });
  return queue.map(function(pair) { return pair[0]; });
}

/**
 * Helper function for analyzeAndTraverse which queues up all of the children
 * of the given node.
 *
 * Children can also be found in arrays, so we basically want to merge all of
 * those arrays together so we can sort them and then traverse the children
 * in order.
 *
 * One example is the Program node. It contains `body` and `comments`, both
 * arrays. Lexographically, comments are interspersed throughout the body
 * nodes, but esprima's AST groups them together.
 */
function enqueueNodeWithStartIndex(queue, node) {
  if (typeof node !== 'object' || node === null) {
    return;
  }
  if (node.range) {
    queue.push([node, node.range[0]]);
  } else if (Array.isArray(node)) {
    for (var ii = 0; ii < node.length; ii++) {
      enqueueNodeWithStartIndex(queue, node[ii]);
    }
  }
}

/**
 * Checks whether a node or any of its sub-nodes contains
 * a syntactic construct of the passed type.
 * @param {object} node - AST node to test.
 * @param {string} type - node type to lookup.
 */
function containsChildOfType(node, type) {
  return containsChildMatching(node, function(node) {
    return node.type === type;
  });
}

function containsChildMatching(node, matcher) {
  var foundMatchingChild = false;
  function nodeTypeAnalyzer(node) {
    if (matcher(node) === true) {
      foundMatchingChild = true;
      return false;
    }
  }
  function nodeTypeTraverser(child, path, state) {
    if (!foundMatchingChild) {
      foundMatchingChild = containsChildMatching(child, matcher);
    }
  }
  analyzeAndTraverse(
    nodeTypeAnalyzer,
    nodeTypeTraverser,
    node,
    []
  );
  return foundMatchingChild;
}

var scopeTypes = {};
scopeTypes[Syntax.FunctionExpression] = true;
scopeTypes[Syntax.FunctionDeclaration] = true;
scopeTypes[Syntax.Program] = true;

function getBoundaryNode(path) {
  for (var ii = 0; ii < path.length; ++ii) {
    if (scopeTypes[path[ii].type]) {
      return path[ii];
    }
  }
  throw new Error(
    'Expected to find a node with one of the following types in path:\n' +
    JSON.stringify(Object.keys(scopeTypes))
  );
}

function getTempVar(tempVarIndex) {
  return '$__' + tempVarIndex;
}

function getTempVarWithValue(tempVarIndex, tempVarValue) {
  return getTempVar(tempVarIndex) + '=' + tempVarValue;
}

exports.append = append;
exports.catchup = catchup;
exports.catchupWhiteOut = catchupWhiteOut;
exports.catchupWhiteSpace = catchupWhiteSpace;
exports.catchupNewlines = catchupNewlines;
exports.containsChildMatching = containsChildMatching;
exports.containsChildOfType = containsChildOfType;
exports.createState = createState;
exports.declareIdentInLocalScope = declareIdentInLocalScope;
exports.getBoundaryNode = getBoundaryNode;
exports.getDocblock = getDocblock;
exports.getLexicalBindingMetadata = getLexicalBindingMetadata;
exports.initScopeMetadata = initScopeMetadata;
exports.identWithinLexicalScope = identWithinLexicalScope;
exports.identInLocalScope = identInLocalScope;
exports.indentBefore = indentBefore;
exports.move = move;
exports.scopeTypes = scopeTypes;
exports.updateIndent = updateIndent;
exports.updateState = updateState;
exports.analyzeAndTraverse = analyzeAndTraverse;
exports.getOrderedChildren = getOrderedChildren;
exports.getNodeSourceText = getNodeSourceText;
exports.getTempVar = getTempVar;
exports.getTempVarWithValue = getTempVarWithValue;

},{"./docblock":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/docblock.js","esprima-fb":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/esprima-fb/esprima.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es6-arrow-function-visitors.js":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*global exports:true*/

/**
 * Desugars ES6 Arrow functions to ES3 function expressions.
 * If the function contains `this` expression -- automatically
 * binds the function to current value of `this`.
 *
 * Single parameter, simple expression:
 *
 * [1, 2, 3].map(x => x * x);
 *
 * [1, 2, 3].map(function(x) { return x * x; });
 *
 * Several parameters, complex block:
 *
 * this.users.forEach((user, idx) => {
 *   return this.isActive(idx) && this.send(user);
 * });
 *
 * this.users.forEach(function(user, idx) {
 *   return this.isActive(idx) && this.send(user);
 * }.bind(this));
 *
 */
var restParamVisitors = require('./es6-rest-param-visitors');
var destructuringVisitors = require('./es6-destructuring-visitors');

var Syntax = require('esprima-fb').Syntax;
var utils = require('../src/utils');

/**
 * @public
 */
function visitArrowFunction(traverse, node, path, state) {
  var notInExpression = (path[0].type === Syntax.ExpressionStatement);

  // Wrap a function into a grouping operator, if it's not
  // in the expression position.
  if (notInExpression) {
    utils.append('(', state);
  }

  utils.append('function', state);
  renderParams(traverse, node, path, state);

  // Skip arrow.
  utils.catchupWhiteSpace(node.body.range[0], state);

  var renderBody = node.body.type == Syntax.BlockStatement
    ? renderStatementBody
    : renderExpressionBody;

  path.unshift(node);
  renderBody(traverse, node, path, state);
  path.shift();

  // Bind the function only if `this` value is used
  // inside it or inside any sub-expression.
  var containsBindingSyntax =
    utils.containsChildMatching(node.body, function(node) {
      return node.type === Syntax.ThisExpression
             || (node.type === Syntax.Identifier
                 && node.name === "super");
    });

  if (containsBindingSyntax) {
    utils.append('.bind(this)', state);
  }

  utils.catchupWhiteSpace(node.range[1], state);

  // Close wrapper if not in the expression.
  if (notInExpression) {
    utils.append(')', state);
  }

  return false;
}

function renderParams(traverse, node, path, state) {
  // To preserve inline typechecking directives, we
  // distinguish between parens-free and paranthesized single param.
  if (isParensFreeSingleParam(node, state) || !node.params.length) {
    utils.append('(', state);
  }
  if (node.params.length !== 0) {
    path.unshift(node);
    traverse(node.params, path, state);
    path.unshift();
  }
  utils.append(')', state);
}

function isParensFreeSingleParam(node, state) {
  return node.params.length === 1 &&
    state.g.source[state.g.position] !== '(';
}

function renderExpressionBody(traverse, node, path, state) {
  // Wrap simple expression bodies into a block
  // with explicit return statement.
  utils.append('{', state);

  // Special handling of rest param.
  if (node.rest) {
    utils.append(
      restParamVisitors.renderRestParamSetup(node, state),
      state
    );
  }

  // Special handling of destructured params.
  destructuringVisitors.renderDestructuredComponents(
    node,
    utils.updateState(state, {
      localScope: {
        parentNode: state.parentNode,
        parentScope: state.parentScope,
        identifiers: state.identifiers,
        tempVarIndex: 0
      }
    })
  );

  utils.append('return ', state);
  renderStatementBody(traverse, node, path, state);
  utils.append(';}', state);
}

function renderStatementBody(traverse, node, path, state) {
  traverse(node.body, path, state);
  utils.catchup(node.body.range[1], state);
}

visitArrowFunction.test = function(node, path, state) {
  return node.type === Syntax.ArrowFunctionExpression;
};

exports.visitorList = [
  visitArrowFunction
];


},{"../src/utils":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/utils.js","./es6-destructuring-visitors":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es6-destructuring-visitors.js","./es6-rest-param-visitors":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es6-rest-param-visitors.js","esprima-fb":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/esprima-fb/esprima.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es6-class-visitors.js":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jslint node:true*/

/**
 * @typechecks
 */
'use strict';

var base62 = require('base62');
var Syntax = require('esprima-fb').Syntax;
var utils = require('../src/utils');
var reservedWordsHelper = require('./reserved-words-helper');

var declareIdentInLocalScope = utils.declareIdentInLocalScope;
var initScopeMetadata = utils.initScopeMetadata;

var SUPER_PROTO_IDENT_PREFIX = '____SuperProtoOf';

var _anonClassUUIDCounter = 0;
var _mungedSymbolMaps = {};

function resetSymbols() {
  _anonClassUUIDCounter = 0;
  _mungedSymbolMaps = {};
}

/**
 * Used to generate a unique class for use with code-gens for anonymous class
 * expressions.
 *
 * @param {object} state
 * @return {string}
 */
function _generateAnonymousClassName(state) {
  var mungeNamespace = state.mungeNamespace || '';
  return '____Class' + mungeNamespace + base62.encode(_anonClassUUIDCounter++);
}

/**
 * Given an identifier name, munge it using the current state's mungeNamespace.
 *
 * @param {string} identName
 * @param {object} state
 * @return {string}
 */
function _getMungedName(identName, state) {
  var mungeNamespace = state.mungeNamespace;
  var shouldMinify = state.g.opts.minify;

  if (shouldMinify) {
    if (!_mungedSymbolMaps[mungeNamespace]) {
      _mungedSymbolMaps[mungeNamespace] = {
        symbolMap: {},
        identUUIDCounter: 0
      };
    }

    var symbolMap = _mungedSymbolMaps[mungeNamespace].symbolMap;
    if (!symbolMap[identName]) {
      symbolMap[identName] =
        base62.encode(_mungedSymbolMaps[mungeNamespace].identUUIDCounter++);
    }
    identName = symbolMap[identName];
  }
  return '$' + mungeNamespace + identName;
}

/**
 * Extracts super class information from a class node.
 *
 * Information includes name of the super class and/or the expression string
 * (if extending from an expression)
 *
 * @param {object} node
 * @param {object} state
 * @return {object}
 */
function _getSuperClassInfo(node, state) {
  var ret = {
    name: null,
    expression: null
  };
  if (node.superClass) {
    if (node.superClass.type === Syntax.Identifier) {
      ret.name = node.superClass.name;
    } else {
      // Extension from an expression
      ret.name = _generateAnonymousClassName(state);
      ret.expression = state.g.source.substring(
        node.superClass.range[0],
        node.superClass.range[1]
      );
    }
  }
  return ret;
}

/**
 * Used with .filter() to find the constructor method in a list of
 * MethodDefinition nodes.
 *
 * @param {object} classElement
 * @return {boolean}
 */
function _isConstructorMethod(classElement) {
  return classElement.type === Syntax.MethodDefinition &&
         classElement.key.type === Syntax.Identifier &&
         classElement.key.name === 'constructor';
}

/**
 * @param {object} node
 * @param {object} state
 * @return {boolean}
 */
function _shouldMungeIdentifier(node, state) {
  return (
    !!state.methodFuncNode &&
    !utils.getDocblock(state).hasOwnProperty('preventMunge') &&
    /^_(?!_)/.test(node.name)
  );
}

/**
 * @param {function} traverse
 * @param {object} node
 * @param {array} path
 * @param {object} state
 */
function visitClassMethod(traverse, node, path, state) {
  if (!state.g.opts.es5 && (node.kind === 'get' || node.kind === 'set')) {
    throw new Error(
      'This transform does not support ' + node.kind + 'ter methods for ES6 ' +
      'classes. (line: ' + node.loc.start.line + ', col: ' +
      node.loc.start.column + ')'
    );
  }
  state = utils.updateState(state, {
    methodNode: node
  });
  utils.catchup(node.range[0], state);
  path.unshift(node);
  traverse(node.value, path, state);
  path.shift();
  return false;
}
visitClassMethod.test = function(node, path, state) {
  return node.type === Syntax.MethodDefinition;
};

/**
 * @param {function} traverse
 * @param {object} node
 * @param {array} path
 * @param {object} state
 */
function visitClassFunctionExpression(traverse, node, path, state) {
  var methodNode = path[0];
  var isGetter = methodNode.kind === 'get';
  var isSetter = methodNode.kind === 'set';

  state = utils.updateState(state, {
    methodFuncNode: node
  });

  if (methodNode.key.name === 'constructor') {
    utils.append('function ' + state.className, state);
  } else {
    var methodAccessor;
    var prototypeOrStatic = methodNode.static ? '' : '.prototype';
    var objectAccessor = state.className + prototypeOrStatic;

    if (methodNode.key.type === Syntax.Identifier) {
      // foo() {}
      methodAccessor = methodNode.key.name;
      if (_shouldMungeIdentifier(methodNode.key, state)) {
        methodAccessor = _getMungedName(methodAccessor, state);
      }
      if (isGetter || isSetter) {
        methodAccessor = JSON.stringify(methodAccessor);
      } else if (reservedWordsHelper.isReservedWord(methodAccessor)) {
        methodAccessor = '[' + JSON.stringify(methodAccessor) + ']';
      } else {
        methodAccessor = '.' + methodAccessor;
      }
    } else if (methodNode.key.type === Syntax.Literal) {
      // 'foo bar'() {}  | get 'foo bar'() {} | set 'foo bar'() {}
      methodAccessor = JSON.stringify(methodNode.key.value);
      if (!(isGetter || isSetter)) {
        methodAccessor = '[' + methodAccessor + ']';
      }
    }

    if (isSetter || isGetter) {
      utils.append(
        'Object.defineProperty(' +
          objectAccessor + ',' +
          methodAccessor + ',' +
          '{enumerable:true,configurable:true,' +
          methodNode.kind + ':function',
        state
      );
    } else {
      utils.append(
        objectAccessor +
        methodAccessor + '=function' + (node.generator ? '*' : ''),
        state
      );
    }
  }
  utils.move(methodNode.key.range[1], state);
  utils.append('(', state);

  var params = node.params;
  if (params.length > 0) {
    utils.catchupNewlines(params[0].range[0], state);
    for (var i = 0; i < params.length; i++) {
      utils.catchup(node.params[i].range[0], state);
      path.unshift(node);
      traverse(params[i], path, state);
      path.shift();
    }
  }
  utils.append(')', state);
  utils.catchupWhiteSpace(node.body.range[0], state);
  utils.append('{', state);
  if (!state.scopeIsStrict) {
    utils.append('"use strict";', state);
    state = utils.updateState(state, {
      scopeIsStrict: true
    });
  }
  utils.move(node.body.range[0] + '{'.length, state);

  path.unshift(node);
  traverse(node.body, path, state);
  path.shift();
  utils.catchup(node.body.range[1], state);

  if (methodNode.key.name !== 'constructor') {
    if (isGetter || isSetter) {
      utils.append('})', state);
    }
    utils.append(';', state);
  }
  return false;
}
visitClassFunctionExpression.test = function(node, path, state) {
  return node.type === Syntax.FunctionExpression
         && path[0].type === Syntax.MethodDefinition;
};

function visitClassMethodParam(traverse, node, path, state) {
  var paramName = node.name;
  if (_shouldMungeIdentifier(node, state)) {
    paramName = _getMungedName(node.name, state);
  }
  utils.append(paramName, state);
  utils.move(node.range[1], state);
}
visitClassMethodParam.test = function(node, path, state) {
  if (!path[0] || !path[1]) {
    return;
  }

  var parentFuncExpr = path[0];
  var parentClassMethod = path[1];

  return parentFuncExpr.type === Syntax.FunctionExpression
         && parentClassMethod.type === Syntax.MethodDefinition
         && node.type === Syntax.Identifier;
};

/**
 * @param {function} traverse
 * @param {object} node
 * @param {array} path
 * @param {object} state
 */
function _renderClassBody(traverse, node, path, state) {
  var className = state.className;
  var superClass = state.superClass;

  // Set up prototype of constructor on same line as `extends` for line-number
  // preservation. This relies on function-hoisting if a constructor function is
  // defined in the class body.
  if (superClass.name) {
    // If the super class is an expression, we need to memoize the output of the
    // expression into the generated class name variable and use that to refer
    // to the super class going forward. Example:
    //
    //   class Foo extends mixin(Bar, Baz) {}
    //     --transforms to--
    //   function Foo() {} var ____Class0Blah = mixin(Bar, Baz);
    if (superClass.expression !== null) {
      utils.append(
        'var ' + superClass.name + '=' + superClass.expression + ';',
        state
      );
    }

    var keyName = superClass.name + '____Key';
    var keyNameDeclarator = '';
    if (!utils.identWithinLexicalScope(keyName, state)) {
      keyNameDeclarator = 'var ';
      declareIdentInLocalScope(keyName, initScopeMetadata(node), state);
    }
    utils.append(
      'for(' + keyNameDeclarator + keyName + ' in ' + superClass.name + '){' +
        'if(' + superClass.name + '.hasOwnProperty(' + keyName + ')){' +
          className + '[' + keyName + ']=' +
            superClass.name + '[' + keyName + '];' +
        '}' +
      '}',
      state
    );

    var superProtoIdentStr = SUPER_PROTO_IDENT_PREFIX + superClass.name;
    if (!utils.identWithinLexicalScope(superProtoIdentStr, state)) {
      utils.append(
        'var ' + superProtoIdentStr + '=' + superClass.name + '===null?' +
        'null:' + superClass.name + '.prototype;',
        state
      );
      declareIdentInLocalScope(superProtoIdentStr, initScopeMetadata(node), state);
    }

    utils.append(
      className + '.prototype=Object.create(' + superProtoIdentStr + ');',
      state
    );
    utils.append(
      className + '.prototype.constructor=' + className + ';',
      state
    );
    utils.append(
      className + '.__superConstructor__=' + superClass.name + ';',
      state
    );
  }

  // If there's no constructor method specified in the class body, create an
  // empty constructor function at the top (same line as the class keyword)
  if (!node.body.body.filter(_isConstructorMethod).pop()) {
    utils.append('function ' + className + '(){', state);
    if (!state.scopeIsStrict) {
      utils.append('"use strict";', state);
    }
    if (superClass.name) {
      utils.append(
        'if(' + superClass.name + '!==null){' +
        superClass.name + '.apply(this,arguments);}',
        state
      );
    }
    utils.append('}', state);
  }

  utils.move(node.body.range[0] + '{'.length, state);
  traverse(node.body, path, state);
  utils.catchupWhiteSpace(node.range[1], state);
}

/**
 * @param {function} traverse
 * @param {object} node
 * @param {array} path
 * @param {object} state
 */
function visitClassDeclaration(traverse, node, path, state) {
  var className = node.id.name;
  var superClass = _getSuperClassInfo(node, state);

  state = utils.updateState(state, {
    mungeNamespace: className,
    className: className,
    superClass: superClass
  });

  _renderClassBody(traverse, node, path, state);

  return false;
}
visitClassDeclaration.test = function(node, path, state) {
  return node.type === Syntax.ClassDeclaration;
};

/**
 * @param {function} traverse
 * @param {object} node
 * @param {array} path
 * @param {object} state
 */
function visitClassExpression(traverse, node, path, state) {
  var className = node.id && node.id.name || _generateAnonymousClassName(state);
  var superClass = _getSuperClassInfo(node, state);

  utils.append('(function(){', state);

  state = utils.updateState(state, {
    mungeNamespace: className,
    className: className,
    superClass: superClass
  });

  _renderClassBody(traverse, node, path, state);

  utils.append('return ' + className + ';})()', state);
  return false;
}
visitClassExpression.test = function(node, path, state) {
  return node.type === Syntax.ClassExpression;
};

/**
 * @param {function} traverse
 * @param {object} node
 * @param {array} path
 * @param {object} state
 */
function visitPrivateIdentifier(traverse, node, path, state) {
  utils.append(_getMungedName(node.name, state), state);
  utils.move(node.range[1], state);
}
visitPrivateIdentifier.test = function(node, path, state) {
  if (node.type === Syntax.Identifier && _shouldMungeIdentifier(node, state)) {
    // Always munge non-computed properties of MemberExpressions
    // (a la preventing access of properties of unowned objects)
    if (path[0].type === Syntax.MemberExpression && path[0].object !== node
        && path[0].computed === false) {
      return true;
    }

    // Always munge identifiers that were declared within the method function
    // scope
    if (utils.identWithinLexicalScope(node.name, state, state.methodFuncNode)) {
      return true;
    }

    // Always munge private keys on object literals defined within a method's
    // scope.
    if (path[0].type === Syntax.Property
        && path[1].type === Syntax.ObjectExpression) {
      return true;
    }

    // Always munge function parameters
    if (path[0].type === Syntax.FunctionExpression
        || path[0].type === Syntax.FunctionDeclaration
        || path[0].type === Syntax.ArrowFunctionExpression) {
      for (var i = 0; i < path[0].params.length; i++) {
        if (path[0].params[i] === node) {
          return true;
        }
      }
    }
  }
  return false;
};

/**
 * @param {function} traverse
 * @param {object} node
 * @param {array} path
 * @param {object} state
 */
function visitSuperCallExpression(traverse, node, path, state) {
  var superClassName = state.superClass.name;

  if (node.callee.type === Syntax.Identifier) {
    if (_isConstructorMethod(state.methodNode)) {
      utils.append(superClassName + '.call(', state);
    } else {
      var protoProp = SUPER_PROTO_IDENT_PREFIX + superClassName;
      if (state.methodNode.key.type === Syntax.Identifier) {
        protoProp += '.' + state.methodNode.key.name;
      } else if (state.methodNode.key.type === Syntax.Literal) {
        protoProp += '[' + JSON.stringify(state.methodNode.key.value) + ']';
      }
      utils.append(protoProp + ".call(", state);
    }
    utils.move(node.callee.range[1], state);
  } else if (node.callee.type === Syntax.MemberExpression) {
    utils.append(SUPER_PROTO_IDENT_PREFIX + superClassName, state);
    utils.move(node.callee.object.range[1], state);

    if (node.callee.computed) {
      // ["a" + "b"]
      utils.catchup(node.callee.property.range[1] + ']'.length, state);
    } else {
      // .ab
      utils.append('.' + node.callee.property.name, state);
    }

    utils.append('.call(', state);
    utils.move(node.callee.range[1], state);
  }

  utils.append('this', state);
  if (node.arguments.length > 0) {
    utils.append(',', state);
    utils.catchupWhiteSpace(node.arguments[0].range[0], state);
    traverse(node.arguments, path, state);
  }

  utils.catchupWhiteSpace(node.range[1], state);
  utils.append(')', state);
  return false;
}
visitSuperCallExpression.test = function(node, path, state) {
  if (state.superClass && node.type === Syntax.CallExpression) {
    var callee = node.callee;
    if (callee.type === Syntax.Identifier && callee.name === 'super'
        || callee.type == Syntax.MemberExpression
           && callee.object.name === 'super') {
      return true;
    }
  }
  return false;
};

/**
 * @param {function} traverse
 * @param {object} node
 * @param {array} path
 * @param {object} state
 */
function visitSuperMemberExpression(traverse, node, path, state) {
  var superClassName = state.superClass.name;

  utils.append(SUPER_PROTO_IDENT_PREFIX + superClassName, state);
  utils.move(node.object.range[1], state);
}
visitSuperMemberExpression.test = function(node, path, state) {
  return state.superClass
         && node.type === Syntax.MemberExpression
         && node.object.type === Syntax.Identifier
         && node.object.name === 'super';
};

exports.resetSymbols = resetSymbols;

exports.visitorList = [
  visitClassDeclaration,
  visitClassExpression,
  visitClassFunctionExpression,
  visitClassMethod,
  visitClassMethodParam,
  visitPrivateIdentifier,
  visitSuperCallExpression,
  visitSuperMemberExpression
];

},{"../src/utils":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/utils.js","./reserved-words-helper":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/reserved-words-helper.js","base62":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/base62/base62.js","esprima-fb":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/esprima-fb/esprima.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es6-destructuring-visitors.js":[function(require,module,exports){
/**
 * Copyright 2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*global exports:true*/

/**
 * Implements ES6 destructuring assignment and pattern matchng.
 *
 * function init({port, ip, coords: [x, y]}) {
 *   return (x && y) ? {id, port} : {ip};
 * };
 *
 * function init($__0) {
 *   var
 *    port = $__0.port,
 *    ip = $__0.ip,
 *    $__1 = $__0.coords,
 *    x = $__1[0],
 *    y = $__1[1];
 *   return (x && y) ? {id, port} : {ip};
 * }
 *
 * var x, {ip, port} = init({ip, port});
 *
 * var x, $__0 = init({ip, port}), ip = $__0.ip, port = $__0.port;
 *
 */
var Syntax = require('esprima-fb').Syntax;
var utils = require('../src/utils');

var reservedWordsHelper = require('./reserved-words-helper');
var restParamVisitors = require('./es6-rest-param-visitors');
var restPropertyHelpers = require('./es7-rest-property-helpers');

// -------------------------------------------------------
// 1. Structured variable declarations.
//
// var [a, b] = [b, a];
// var {x, y} = {y, x};
// -------------------------------------------------------

function visitStructuredVariable(traverse, node, path, state) {
  // Allocate new temp for the pattern.
  utils.append(utils.getTempVar(state.localScope.tempVarIndex) + '=', state);
  // Skip the pattern and assign the init to the temp.
  utils.catchupWhiteSpace(node.init.range[0], state);
  traverse(node.init, path, state);
  utils.catchup(node.init.range[1], state);
  // Render the destructured data.
  utils.append(',' + getDestructuredComponents(node.id, state), state);
  state.localScope.tempVarIndex++;
  return false;
}

visitStructuredVariable.test = function(node, path, state) {
  return node.type === Syntax.VariableDeclarator &&
    isStructuredPattern(node.id);
};

function isStructuredPattern(node) {
  return node.type === Syntax.ObjectPattern ||
    node.type === Syntax.ArrayPattern;
}

// Main function which does actual recursive destructuring
// of nested complex structures.
function getDestructuredComponents(node, state) {
  var tmpIndex = state.localScope.tempVarIndex;
  var components = [];
  var patternItems = getPatternItems(node);

  for (var idx = 0; idx < patternItems.length; idx++) {
    var item = patternItems[idx];
    if (!item) {
      continue;
    }

    if (item.type === Syntax.SpreadElement) {
      // Spread/rest of an array.
      // TODO(dmitrys): support spread in the middle of a pattern
      // and also for function param patterns: [x, ...xs, y]
      components.push(item.argument.name +
        '=Array.prototype.slice.call(' +
        utils.getTempVar(tmpIndex) + ',' + idx + ')'
      );
      continue;
    }

    if (item.type === Syntax.SpreadProperty) {
      var restExpression = restPropertyHelpers.renderRestExpression(
        utils.getTempVar(tmpIndex),
        patternItems
      );
      components.push(item.argument.name + '=' + restExpression);
      continue;
    }

    // Depending on pattern type (Array or Object), we get
    // corresponding pattern item parts.
    var accessor = getPatternItemAccessor(node, item, tmpIndex, idx);
    var value = getPatternItemValue(node, item);

    // TODO(dmitrys): implement default values: {x, y=5}
    if (value.type === Syntax.Identifier) {
      // Simple pattern item.
      components.push(value.name + '=' + accessor);
    } else {
      // Complex sub-structure.
      components.push(
        utils.getTempVarWithValue(++state.localScope.tempVarIndex, accessor) +
        ',' + getDestructuredComponents(value, state)
      );
    }
  }

  return components.join(',');
}

function getPatternItems(node) {
  return node.properties || node.elements;
}

function getPatternItemAccessor(node, patternItem, tmpIndex, idx) {
  var tmpName = utils.getTempVar(tmpIndex);
  if (node.type === Syntax.ObjectPattern) {
    if (reservedWordsHelper.isReservedWord(patternItem.key.name)) {
      return tmpName + '["' + patternItem.key.name + '"]';
    } else if (patternItem.key.type === Syntax.Literal) {
      return tmpName + '[' + JSON.stringify(patternItem.key.value) + ']';
    } else if (patternItem.key.type === Syntax.Identifier) {
      return tmpName + '.' + patternItem.key.name;
    }
  } else if (node.type === Syntax.ArrayPattern) {
    return tmpName + '[' + idx + ']';
  }
}

function getPatternItemValue(node, patternItem) {
  return node.type === Syntax.ObjectPattern
    ? patternItem.value
    : patternItem;
}

// -------------------------------------------------------
// 2. Assignment expression.
//
// [a, b] = [b, a];
// ({x, y} = {y, x});
// -------------------------------------------------------

function visitStructuredAssignment(traverse, node, path, state) {
  var exprNode = node.expression;
  utils.append('var ' + utils.getTempVar(state.localScope.tempVarIndex) + '=', state);

  utils.catchupWhiteSpace(exprNode.right.range[0], state);
  traverse(exprNode.right, path, state);
  utils.catchup(exprNode.right.range[1], state);

  utils.append(
    ';' + getDestructuredComponents(exprNode.left, state) + ';',
    state
  );

  utils.catchupWhiteSpace(node.range[1], state);
  state.localScope.tempVarIndex++;
  return false;
}

visitStructuredAssignment.test = function(node, path, state) {
  // We consider the expression statement rather than just assignment
  // expression to cover case with object patters which should be
  // wrapped in grouping operator: ({x, y} = {y, x});
  return node.type === Syntax.ExpressionStatement &&
    node.expression.type === Syntax.AssignmentExpression &&
    isStructuredPattern(node.expression.left);
};

// -------------------------------------------------------
// 3. Structured parameter.
//
// function foo({x, y}) { ... }
// -------------------------------------------------------

function visitStructuredParameter(traverse, node, path, state) {
  utils.append(utils.getTempVar(getParamIndex(node, path)), state);
  utils.catchupWhiteSpace(node.range[1], state);
  return true;
}

function getParamIndex(paramNode, path) {
  var funcNode = path[0];
  var tmpIndex = 0;
  for (var k = 0; k < funcNode.params.length; k++) {
    var param = funcNode.params[k];
    if (param === paramNode) {
      break;
    }
    if (isStructuredPattern(param)) {
      tmpIndex++;
    }
  }
  return tmpIndex;
}

visitStructuredParameter.test = function(node, path, state) {
  return isStructuredPattern(node) && isFunctionNode(path[0]);
};

function isFunctionNode(node) {
  return (node.type == Syntax.FunctionDeclaration ||
    node.type == Syntax.FunctionExpression ||
    node.type == Syntax.MethodDefinition ||
    node.type == Syntax.ArrowFunctionExpression);
}

// -------------------------------------------------------
// 4. Function body for structured parameters.
//
// function foo({x, y}) { x; y; }
// -------------------------------------------------------

function visitFunctionBodyForStructuredParameter(traverse, node, path, state) {
  var funcNode = path[0];

  utils.catchup(funcNode.body.range[0] + 1, state);
  renderDestructuredComponents(funcNode, state);

  if (funcNode.rest) {
    utils.append(
      restParamVisitors.renderRestParamSetup(funcNode, state),
      state
    );
  }

  return true;
}

function renderDestructuredComponents(funcNode, state) {
  var destructuredComponents = [];

  for (var k = 0; k < funcNode.params.length; k++) {
    var param = funcNode.params[k];
    if (isStructuredPattern(param)) {
      destructuredComponents.push(
        getDestructuredComponents(param, state)
      );
      state.localScope.tempVarIndex++;
    }
  }

  if (destructuredComponents.length) {
    utils.append('var ' + destructuredComponents.join(',') + ';', state);
  }
}

visitFunctionBodyForStructuredParameter.test = function(node, path, state) {
  return node.type === Syntax.BlockStatement && isFunctionNode(path[0]);
};

exports.visitorList = [
  visitStructuredVariable,
  visitStructuredAssignment,
  visitStructuredParameter,
  visitFunctionBodyForStructuredParameter
];

exports.renderDestructuredComponents = renderDestructuredComponents;


},{"../src/utils":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/utils.js","./es6-rest-param-visitors":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es6-rest-param-visitors.js","./es7-rest-property-helpers":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es7-rest-property-helpers.js","./reserved-words-helper":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/reserved-words-helper.js","esprima-fb":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/esprima-fb/esprima.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es6-object-concise-method-visitors.js":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jslint node:true*/

/**
 * Desugars concise methods of objects to function expressions.
 *
 * var foo = {
 *   method(x, y) { ... }
 * };
 *
 * var foo = {
 *   method: function(x, y) { ... }
 * };
 *
 */

var Syntax = require('esprima-fb').Syntax;
var utils = require('../src/utils');
var reservedWordsHelper = require('./reserved-words-helper');

function visitObjectConciseMethod(traverse, node, path, state) {
  var isGenerator = node.value.generator;
  if (isGenerator) {
    utils.catchupWhiteSpace(node.range[0] + 1, state);
  }
  if (node.computed) { // [<expr>]() { ...}
    utils.catchup(node.key.range[1] + 1, state);
  } else if (reservedWordsHelper.isReservedWord(node.key.name)) {
    utils.catchup(node.key.range[0], state);
    utils.append('"', state);
    utils.catchup(node.key.range[1], state);
    utils.append('"', state);
  }

  utils.catchup(node.key.range[1], state);
  utils.append(
    ':function' + (isGenerator ? '*' : ''),
    state
  );
  path.unshift(node);
  traverse(node.value, path, state);
  path.shift();
  return false;
}

visitObjectConciseMethod.test = function(node, path, state) {
  return node.type === Syntax.Property &&
    node.value.type === Syntax.FunctionExpression &&
    node.method === true;
};

exports.visitorList = [
  visitObjectConciseMethod
];

},{"../src/utils":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/utils.js","./reserved-words-helper":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/reserved-words-helper.js","esprima-fb":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/esprima-fb/esprima.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es6-object-short-notation-visitors.js":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jslint node: true*/

/**
 * Desugars ES6 Object Literal short notations into ES3 full notation.
 *
 * // Easier return values.
 * function foo(x, y) {
 *   return {x, y}; // {x: x, y: y}
 * };
 *
 * // Destructuring.
 * function init({port, ip, coords: {x, y}}) { ... }
 *
 */
var Syntax = require('esprima-fb').Syntax;
var utils = require('../src/utils');

/**
 * @public
 */
function visitObjectLiteralShortNotation(traverse, node, path, state) {
  utils.catchup(node.key.range[1], state);
  utils.append(':' + node.key.name, state);
  return false;
}

visitObjectLiteralShortNotation.test = function(node, path, state) {
  return node.type === Syntax.Property &&
    node.kind === 'init' &&
    node.shorthand === true &&
    path[0].type !== Syntax.ObjectPattern;
};

exports.visitorList = [
  visitObjectLiteralShortNotation
];


},{"../src/utils":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/utils.js","esprima-fb":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/esprima-fb/esprima.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es6-rest-param-visitors.js":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jslint node:true*/

/**
 * Desugars ES6 rest parameters into an ES3 arguments array.
 *
 * function printf(template, ...args) {
 *   args.forEach(...);
 * }
 *
 * We could use `Array.prototype.slice.call`, but that usage of arguments causes
 * functions to be deoptimized in V8, so instead we use a for-loop.
 *
 * function printf(template) {
 *   for (var args = [], $__0 = 1, $__1 = arguments.length; $__0 < $__1; $__0++)
 *     args.push(arguments[$__0]);
 *   args.forEach(...);
 * }
 *
 */
var Syntax = require('esprima-fb').Syntax;
var utils = require('../src/utils');



function _nodeIsFunctionWithRestParam(node) {
  return (node.type === Syntax.FunctionDeclaration
          || node.type === Syntax.FunctionExpression
          || node.type === Syntax.ArrowFunctionExpression)
         && node.rest;
}

function visitFunctionParamsWithRestParam(traverse, node, path, state) {
  if (node.parametricType) {
    utils.catchup(node.parametricType.range[0], state);
    path.unshift(node);
    traverse(node.parametricType, path, state);
    path.shift();
  }

  // Render params.
  if (node.params.length) {
    path.unshift(node);
    traverse(node.params, path, state);
    path.shift();
  } else {
    // -3 is for ... of the rest.
    utils.catchup(node.rest.range[0] - 3, state);
  }
  utils.catchupWhiteSpace(node.rest.range[1], state);

  path.unshift(node);
  traverse(node.body, path, state);
  path.shift();

  return false;
}

visitFunctionParamsWithRestParam.test = function(node, path, state) {
  return _nodeIsFunctionWithRestParam(node);
};

function renderRestParamSetup(functionNode, state) {
  var idx = state.localScope.tempVarIndex++;
  var len = state.localScope.tempVarIndex++;

  return 'for (var ' + functionNode.rest.name + '=[],' +
    utils.getTempVarWithValue(idx, functionNode.params.length) + ',' +
    utils.getTempVarWithValue(len, 'arguments.length') + ';' +
    utils.getTempVar(idx) + '<' +  utils.getTempVar(len) + ';' +
    utils.getTempVar(idx) + '++) ' +
    functionNode.rest.name + '.push(arguments[' + utils.getTempVar(idx) + ']);';
}

function visitFunctionBodyWithRestParam(traverse, node, path, state) {
  utils.catchup(node.range[0] + 1, state);
  var parentNode = path[0];
  utils.append(renderRestParamSetup(parentNode, state), state);
  return true;
}

visitFunctionBodyWithRestParam.test = function(node, path, state) {
  return node.type === Syntax.BlockStatement
         && _nodeIsFunctionWithRestParam(path[0]);
};

exports.renderRestParamSetup = renderRestParamSetup;
exports.visitorList = [
  visitFunctionParamsWithRestParam,
  visitFunctionBodyWithRestParam
];

},{"../src/utils":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/utils.js","esprima-fb":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/esprima-fb/esprima.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es6-template-visitors.js":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jslint node:true*/

/**
 * @typechecks
 */
'use strict';

var Syntax = require('esprima-fb').Syntax;
var utils = require('../src/utils');

/**
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-12.1.9
 */
function visitTemplateLiteral(traverse, node, path, state) {
  var templateElements = node.quasis;

  utils.append('(', state);
  for (var ii = 0; ii < templateElements.length; ii++) {
    var templateElement = templateElements[ii];
    if (templateElement.value.raw !== '') {
      utils.append(getCookedValue(templateElement), state);
      if (!templateElement.tail) {
        // + between element and substitution
        utils.append(' + ', state);
      }
      // maintain line numbers
      utils.move(templateElement.range[0], state);
      utils.catchupNewlines(templateElement.range[1], state);
    } else {  // templateElement.value.raw === ''
      // Concatenat adjacent substitutions, e.g. `${x}${y}`. Empty templates
      // appear before the first and after the last element - nothing to add in
      // those cases.
      if (ii > 0 && !templateElement.tail) {
        // + between substitution and substitution
        utils.append(' + ', state);
      }
    }

    utils.move(templateElement.range[1], state);
    if (!templateElement.tail) {
      var substitution = node.expressions[ii];
      if (substitution.type === Syntax.Identifier ||
          substitution.type === Syntax.MemberExpression ||
          substitution.type === Syntax.CallExpression) {
        utils.catchup(substitution.range[1], state);
      } else {
        utils.append('(', state);
        traverse(substitution, path, state);
        utils.catchup(substitution.range[1], state);
        utils.append(')', state);
      }
      // if next templateElement isn't empty...
      if (templateElements[ii + 1].value.cooked !== '') {
        utils.append(' + ', state);
      }
    }
  }
  utils.move(node.range[1], state);
  utils.append(')', state);
  return false;
}

visitTemplateLiteral.test = function(node, path, state) {
  return node.type === Syntax.TemplateLiteral;
};

/**
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-12.2.6
 */
function visitTaggedTemplateExpression(traverse, node, path, state) {
  var template = node.quasi;
  var numQuasis = template.quasis.length;

  // print the tag
  utils.move(node.tag.range[0], state);
  traverse(node.tag, path, state);
  utils.catchup(node.tag.range[1], state);

  // print array of template elements
  utils.append('(function() { var siteObj = [', state);
  for (var ii = 0; ii < numQuasis; ii++) {
    utils.append(getCookedValue(template.quasis[ii]), state);
    if (ii !== numQuasis - 1) {
      utils.append(', ', state);
    }
  }
  utils.append(']; siteObj.raw = [', state);
  for (ii = 0; ii < numQuasis; ii++) {
    utils.append(getRawValue(template.quasis[ii]), state);
    if (ii !== numQuasis - 1) {
      utils.append(', ', state);
    }
  }
  utils.append(
    ']; Object.freeze(siteObj.raw); Object.freeze(siteObj); return siteObj; }()',
    state
  );

  // print substitutions
  if (numQuasis > 1) {
    for (ii = 0; ii < template.expressions.length; ii++) {
      var expression = template.expressions[ii];
      utils.append(', ', state);

      // maintain line numbers by calling catchupWhiteSpace over the whole
      // previous TemplateElement
      utils.move(template.quasis[ii].range[0], state);
      utils.catchupNewlines(template.quasis[ii].range[1], state);

      utils.move(expression.range[0], state);
      traverse(expression, path, state);
      utils.catchup(expression.range[1], state);
    }
  }

  // print blank lines to push the closing ) down to account for the final
  // TemplateElement.
  utils.catchupNewlines(node.range[1], state);

  utils.append(')', state);

  return false;
}

visitTaggedTemplateExpression.test = function(node, path, state) {
  return node.type === Syntax.TaggedTemplateExpression;
};

function getCookedValue(templateElement) {
  return JSON.stringify(templateElement.value.cooked);
}

function getRawValue(templateElement) {
  return JSON.stringify(templateElement.value.raw);
}

exports.visitorList = [
  visitTemplateLiteral,
  visitTaggedTemplateExpression
];

},{"../src/utils":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/utils.js","esprima-fb":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/esprima-fb/esprima.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es7-rest-property-helpers.js":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jslint node:true*/

/**
 * Desugars ES7 rest properties into ES5 object iteration.
 */

var Syntax = require('esprima-fb').Syntax;
var utils = require('../src/utils');

// TODO: This is a pretty massive helper, it should only be defined once, in the
// transform's runtime environment. We don't currently have a runtime though.
var restFunction =
  '(function(source, exclusion) {' +
    'var rest = {};' +
    'var hasOwn = Object.prototype.hasOwnProperty;' +
    'if (source == null) {' +
      'throw new TypeError();' +
    '}' +
    'for (var key in source) {' +
      'if (hasOwn.call(source, key) && !hasOwn.call(exclusion, key)) {' +
        'rest[key] = source[key];' +
      '}' +
    '}' +
    'return rest;' +
  '})';

function getPropertyNames(properties) {
  var names = [];
  for (var i = 0; i < properties.length; i++) {
    var property = properties[i];
    if (property.type === Syntax.SpreadProperty) {
      continue;
    }
    if (property.type === Syntax.Identifier) {
      names.push(property.name);
    } else {
      names.push(property.key.name);
    }
  }
  return names;
}

function getRestFunctionCall(source, exclusion) {
  return restFunction + '(' + source + ',' + exclusion + ')';
}

function getSimpleShallowCopy(accessorExpression) {
  // This could be faster with 'Object.assign({}, ' + accessorExpression + ')'
  // but to unify code paths and avoid a ES6 dependency we use the same
  // helper as for the exclusion case.
  return getRestFunctionCall(accessorExpression, '{}');
}

function renderRestExpression(accessorExpression, excludedProperties) {
  var excludedNames = getPropertyNames(excludedProperties);
  if (!excludedNames.length) {
    return getSimpleShallowCopy(accessorExpression);
  }
  return getRestFunctionCall(
    accessorExpression,
    '{' + excludedNames.join(':1,') + ':1}'
  );
}

exports.renderRestExpression = renderRestExpression;

},{"../src/utils":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/utils.js","esprima-fb":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/esprima-fb/esprima.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es7-spread-property-visitors.js":[function(require,module,exports){
/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
/*global exports:true*/

/**
 * Implements ES7 object spread property.
 * https://gist.github.com/sebmarkbage/aa849c7973cb4452c547
 *
 * { ...a, x: 1 }
 *
 * Object.assign({}, a, {x: 1 })
 *
 */

var Syntax = require('esprima-fb').Syntax;
var utils = require('../src/utils');

function visitObjectLiteralSpread(traverse, node, path, state) {
  utils.catchup(node.range[0], state);

  utils.append('Object.assign({', state);

  // Skip the original {
  utils.move(node.range[0] + 1, state);

  var previousWasSpread = false;

  for (var i = 0; i < node.properties.length; i++) {
    var property = node.properties[i];
    if (property.type === Syntax.SpreadProperty) {

      // Close the previous object or initial object
      if (!previousWasSpread) {
        utils.append('}', state);
      }

      if (i === 0) {
        // Normally there will be a comma when we catch up, but not before
        // the first property.
        utils.append(',', state);
      }

      utils.catchup(property.range[0], state);

      // skip ...
      utils.move(property.range[0] + 3, state);

      traverse(property.argument, path, state);

      utils.catchup(property.range[1], state);

      previousWasSpread = true;

    } else {

      utils.catchup(property.range[0], state);

      if (previousWasSpread) {
        utils.append('{', state);
      }

      traverse(property, path, state);

      utils.catchup(property.range[1], state);

      previousWasSpread = false;

    }
  }

  // Strip any non-whitespace between the last item and the end.
  // We only catch up on whitespace so that we ignore any trailing commas which
  // are stripped out for IE8 support. Unfortunately, this also strips out any
  // trailing comments.
  utils.catchupWhiteSpace(node.range[1] - 1, state);

  // Skip the trailing }
  utils.move(node.range[1], state);

  if (!previousWasSpread) {
    utils.append('}', state);
  }

  utils.append(')', state);
  return false;
}

visitObjectLiteralSpread.test = function(node, path, state) {
  if (node.type !== Syntax.ObjectExpression) {
    return false;
  }
  // Tight loop optimization
  var hasAtLeastOneSpreadProperty = false;
  for (var i = 0; i < node.properties.length; i++) {
    var property = node.properties[i];
    if (property.type === Syntax.SpreadProperty) {
      hasAtLeastOneSpreadProperty = true;
    } else if (property.kind !== 'init') {
      return false;
    }
  }
  return hasAtLeastOneSpreadProperty;
};

exports.visitorList = [
  visitObjectLiteralSpread
];

},{"../src/utils":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/utils.js","esprima-fb":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/esprima-fb/esprima.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/reserved-words-helper.js":[function(require,module,exports){
/**
 * Copyright 2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var KEYWORDS = [
  'break', 'do', 'in', 'typeof', 'case', 'else', 'instanceof', 'var', 'catch',
  'export', 'new', 'void', 'class', 'extends', 'return', 'while', 'const',
  'finally', 'super', 'with', 'continue', 'for', 'switch', 'yield', 'debugger',
  'function', 'this', 'default', 'if', 'throw', 'delete', 'import', 'try'
];

var FUTURE_RESERVED_WORDS = [
  'enum', 'await', 'implements', 'package', 'protected', 'static', 'interface',
  'private', 'public'
];

var LITERALS = [
  'null',
  'true',
  'false'
];

// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-reserved-words
var RESERVED_WORDS = [].concat(
  KEYWORDS,
  FUTURE_RESERVED_WORDS,
  LITERALS
);

var reservedWordsMap = Object.create(null);
RESERVED_WORDS.forEach(function(k) {
    reservedWordsMap[k] = true;
});

exports.isReservedWord = function(word) {
  return !!reservedWordsMap[word];
};

},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/type-syntax.js":[function(require,module,exports){
var esprima = require('esprima-fb');
var utils = require('../src/utils');

var Syntax = esprima.Syntax;

function _isFunctionNode(node) {
  return node.type === Syntax.FunctionDeclaration
         || node.type === Syntax.FunctionExpression
         || node.type === Syntax.ArrowFunctionExpression;
}

function visitClassProperty(traverse, node, path, state) {
  utils.catchup(node.range[0], state);
  utils.catchupWhiteOut(node.range[1], state);
  return false;
}
visitClassProperty.test = function(node, path, state) {
  return node.type === Syntax.ClassProperty;
};

function visitTypeAlias(traverse, node, path, state) {
  utils.catchupWhiteOut(node.range[1], state);
  return false;
}
visitTypeAlias.test = function(node, path, state) {
  return node.type === Syntax.TypeAlias;
};

function visitInterfaceDeclaration(traverse, node, path, state) {
  utils.catchupWhiteOut(node.range[1], state);
  return false;
}
visitInterfaceDeclaration.test = function(node, path, state) {
  return node.type === Syntax.InterfaceDeclaration;
};

function visitDeclare(traverse, node, path, state) {
  utils.catchupWhiteOut(node.range[1], state);
  return false;
}
visitDeclare.test = function(node, path, state) {
  switch (node.type) {
  case Syntax.DeclareVariable:
  case Syntax.DeclareFunction:
  case Syntax.DeclareClass:
  case Syntax.DeclareModule: return true
  }
  return false;
}

function visitFunctionParametricAnnotation(traverse, node, path, state) {
  utils.catchup(node.range[0], state);
  utils.catchupWhiteOut(node.range[1], state);
  return false;
}
visitFunctionParametricAnnotation.test = function(node, path, state) {
  return node.type === Syntax.TypeParameterDeclaration
         && path[0]
         && _isFunctionNode(path[0])
         && node === path[0].typeParameters;
};

function visitFunctionReturnAnnotation(traverse, node, path, state) {
  utils.catchup(node.range[0], state);
  utils.catchupWhiteOut(node.range[1], state);
  return false;
}
visitFunctionReturnAnnotation.test = function(node, path, state) {
  return path[0] && _isFunctionNode(path[0]) && node === path[0].returnType;
};

function visitOptionalFunctionParameterAnnotation(traverse, node, path, state) {
  utils.catchup(node.range[0] + node.name.length, state);
  utils.catchupWhiteOut(node.range[1], state);
  return false;
}
visitOptionalFunctionParameterAnnotation.test = function(node, path, state) {
  return node.type === Syntax.Identifier
         && node.optional
         && path[0]
         && _isFunctionNode(path[0]);
};

function visitTypeAnnotatedIdentifier(traverse, node, path, state) {
  utils.catchup(node.typeAnnotation.range[0], state);
  utils.catchupWhiteOut(node.typeAnnotation.range[1], state);
  return false;
}
visitTypeAnnotatedIdentifier.test = function(node, path, state) {
  return node.type === Syntax.Identifier && node.typeAnnotation;
};

function visitTypeAnnotatedObjectOrArrayPattern(traverse, node, path, state) {
  utils.catchup(node.typeAnnotation.range[0], state);
  utils.catchupWhiteOut(node.typeAnnotation.range[1], state);
  return false;
}
visitTypeAnnotatedObjectOrArrayPattern.test = function(node, path, state) {
  var rightType = node.type === Syntax.ObjectPattern
                || node.type === Syntax.ArrayPattern;
  return rightType && node.typeAnnotation;
};

/**
 * Methods cause trouble, since esprima parses them as a key/value pair, where
 * the location of the value starts at the method body. For example
 * { bar(x:number,...y:Array<number>):number {} }
 * is parsed as
 * { bar: function(x: number, ...y:Array<number>): number {} }
 * except that the location of the FunctionExpression value is 40-something,
 * which is the location of the function body. This means that by the time we
 * visit the params, rest param, and return type organically, we've already
 * catchup()'d passed them.
 */
function visitMethod(traverse, node, path, state) {
  path.unshift(node);
  traverse(node.key, path, state);

  path.unshift(node.value);
  traverse(node.value.params, path, state);
  node.value.rest && traverse(node.value.rest, path, state);
  node.value.returnType && traverse(node.value.returnType, path, state);
  traverse(node.value.body, path, state);

  path.shift();

  path.shift();
  return false;
}

visitMethod.test = function(node, path, state) {
  return (node.type === "Property" && (node.method || node.kind === "set" || node.kind === "get"))
      || (node.type === "MethodDefinition");
};

exports.visitorList = [
  visitClassProperty,
  visitDeclare,
  visitInterfaceDeclaration,
  visitFunctionParametricAnnotation,
  visitFunctionReturnAnnotation,
  visitMethod,
  visitOptionalFunctionParameterAnnotation,
  visitTypeAlias,
  visitTypeAnnotatedIdentifier,
  visitTypeAnnotatedObjectOrArrayPattern
];

},{"../src/utils":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/utils.js","esprima-fb":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/node_modules/esprima-fb/esprima.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/vendor/fbtransform/transforms/react.js":[function(require,module,exports){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/*global exports:true*/
"use strict";

var Syntax = require('jstransform').Syntax;
var utils = require('jstransform/src/utils');

var FALLBACK_TAGS = require('./xjs').knownTags;
var renderXJSExpressionContainer =
  require('./xjs').renderXJSExpressionContainer;
var renderXJSLiteral = require('./xjs').renderXJSLiteral;
var quoteAttrName = require('./xjs').quoteAttrName;

var trimLeft = require('./xjs').trimLeft;

/**
 * Customized desugar processor for React JSX. Currently:
 *
 * <X> </X> => React.createElement(X, null)
 * <X prop="1" /> => React.createElement(X, {prop: '1'}, null)
 * <X prop="2"><Y /></X> => React.createElement(X, {prop:'2'},
 *   React.createElement(Y, null)
 * )
 * <div /> => React.createElement("div", null)
 */

/**
 * Removes all non-whitespace/parenthesis characters
 */
var reNonWhiteParen = /([^\s\(\)])/g;
function stripNonWhiteParen(value) {
  return value.replace(reNonWhiteParen, '');
}

var tagConvention = /^[a-z]|\-/;
function isTagName(name) {
  return tagConvention.test(name);
}

function visitReactTag(traverse, object, path, state) {
  var openingElement = object.openingElement;
  var nameObject = openingElement.name;
  var attributesObject = openingElement.attributes;

  utils.catchup(openingElement.range[0], state, trimLeft);

  if (nameObject.type === Syntax.XJSNamespacedName && nameObject.namespace) {
    throw new Error('Namespace tags are not supported. ReactJSX is not XML.');
  }

  // We assume that the React runtime is already in scope
  utils.append('React.createElement(', state);

  // Identifiers with lower case or hypthens are fallback tags (strings).
  // XJSMemberExpressions are not.
  if (nameObject.type === Syntax.XJSIdentifier && isTagName(nameObject.name)) {
    // This is a temporary error message to assist upgrades
    if (!FALLBACK_TAGS.hasOwnProperty(nameObject.name)) {
      throw new Error(
        'Lower case component names (' + nameObject.name + ') are no longer ' +
        'supported in JSX: See http://fb.me/react-jsx-lower-case'
      );
    }

    utils.append('"' + nameObject.name + '"', state);
    utils.move(nameObject.range[1], state);
  } else {
    // Use utils.catchup in this case so we can easily handle
    // XJSMemberExpressions which look like Foo.Bar.Baz. This also handles
    // XJSIdentifiers that aren't fallback tags.
    utils.move(nameObject.range[0], state);
    utils.catchup(nameObject.range[1], state);
  }

  utils.append(', ', state);

  var hasAttributes = attributesObject.length;

  var hasAtLeastOneSpreadProperty = attributesObject.some(function(attr) {
    return attr.type === Syntax.XJSSpreadAttribute;
  });

  // if we don't have any attributes, pass in null
  if (hasAtLeastOneSpreadProperty) {
    utils.append('React.__spread({', state);
  } else if (hasAttributes) {
    utils.append('{', state);
  } else {
    utils.append('null', state);
  }

  // keep track of if the previous attribute was a spread attribute
  var previousWasSpread = false;

  // write attributes
  attributesObject.forEach(function(attr, index) {
    var isLast = index === attributesObject.length - 1;

    if (attr.type === Syntax.XJSSpreadAttribute) {
      // Close the previous object or initial object
      if (!previousWasSpread) {
        utils.append('}, ', state);
      }

      // Move to the expression start, ignoring everything except parenthesis
      // and whitespace.
      utils.catchup(attr.range[0], state, stripNonWhiteParen);
      // Plus 1 to skip `{`.
      utils.move(attr.range[0] + 1, state);
      utils.catchup(attr.argument.range[0], state, stripNonWhiteParen);

      traverse(attr.argument, path, state);

      utils.catchup(attr.argument.range[1], state);

      // Move to the end, ignoring parenthesis and the closing `}`
      utils.catchup(attr.range[1] - 1, state, stripNonWhiteParen);

      if (!isLast) {
        utils.append(', ', state);
      }

      utils.move(attr.range[1], state);

      previousWasSpread = true;

      return;
    }

    // If the next attribute is a spread, we're effective last in this object
    if (!isLast) {
      isLast = attributesObject[index + 1].type === Syntax.XJSSpreadAttribute;
    }

    if (attr.name.namespace) {
      throw new Error(
         'Namespace attributes are not supported. ReactJSX is not XML.');
    }
    var name = attr.name.name;

    utils.catchup(attr.range[0], state, trimLeft);

    if (previousWasSpread) {
      utils.append('{', state);
    }

    utils.append(quoteAttrName(name), state);
    utils.append(': ', state);

    if (!attr.value) {
      state.g.buffer += 'true';
      state.g.position = attr.name.range[1];
      if (!isLast) {
        utils.append(', ', state);
      }
    } else {
      utils.move(attr.name.range[1], state);
      // Use catchupNewlines to skip over the '=' in the attribute
      utils.catchupNewlines(attr.value.range[0], state);
      if (attr.value.type === Syntax.Literal) {
        renderXJSLiteral(attr.value, isLast, state);
      } else {
        renderXJSExpressionContainer(traverse, attr.value, isLast, path, state);
      }
    }

    utils.catchup(attr.range[1], state, trimLeft);

    previousWasSpread = false;

  });

  if (!openingElement.selfClosing) {
    utils.catchup(openingElement.range[1] - 1, state, trimLeft);
    utils.move(openingElement.range[1], state);
  }

  if (hasAttributes && !previousWasSpread) {
    utils.append('}', state);
  }

  if (hasAtLeastOneSpreadProperty) {
    utils.append(')', state);
  }

  // filter out whitespace
  var childrenToRender = object.children.filter(function(child) {
    return !(child.type === Syntax.Literal
             && typeof child.value === 'string'
             && child.value.match(/^[ \t]*[\r\n][ \t\r\n]*$/));
  });
  if (childrenToRender.length > 0) {
    var lastRenderableIndex;

    childrenToRender.forEach(function(child, index) {
      if (child.type !== Syntax.XJSExpressionContainer ||
          child.expression.type !== Syntax.XJSEmptyExpression) {
        lastRenderableIndex = index;
      }
    });

    if (lastRenderableIndex !== undefined) {
      utils.append(', ', state);
    }

    childrenToRender.forEach(function(child, index) {
      utils.catchup(child.range[0], state, trimLeft);

      var isLast = index >= lastRenderableIndex;

      if (child.type === Syntax.Literal) {
        renderXJSLiteral(child, isLast, state);
      } else if (child.type === Syntax.XJSExpressionContainer) {
        renderXJSExpressionContainer(traverse, child, isLast, path, state);
      } else {
        traverse(child, path, state);
        if (!isLast) {
          utils.append(', ', state);
        }
      }

      utils.catchup(child.range[1], state, trimLeft);
    });
  }

  if (openingElement.selfClosing) {
    // everything up to />
    utils.catchup(openingElement.range[1] - 2, state, trimLeft);
    utils.move(openingElement.range[1], state);
  } else {
    // everything up to </ sdflksjfd>
    utils.catchup(object.closingElement.range[0], state, trimLeft);
    utils.move(object.closingElement.range[1], state);
  }

  utils.append(')', state);
  return false;
}

visitReactTag.test = function(object, path, state) {
  return object.type === Syntax.XJSElement;
};

exports.visitorList = [
  visitReactTag
];

},{"./xjs":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/vendor/fbtransform/transforms/xjs.js","jstransform":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/jstransform.js","jstransform/src/utils":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/utils.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/vendor/fbtransform/transforms/reactDisplayName.js":[function(require,module,exports){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/*global exports:true*/
"use strict";

var Syntax = require('jstransform').Syntax;
var utils = require('jstransform/src/utils');

function addDisplayName(displayName, object, state) {
  if (object &&
      object.type === Syntax.CallExpression &&
      object.callee.type === Syntax.MemberExpression &&
      object.callee.object.type === Syntax.Identifier &&
      object.callee.object.name === 'React' &&
      object.callee.property.type === Syntax.Identifier &&
      object.callee.property.name === 'createClass' &&
      object['arguments'].length === 1 &&
      object['arguments'][0].type === Syntax.ObjectExpression) {
    // Verify that the displayName property isn't already set
    var properties = object['arguments'][0].properties;
    var safe = properties.every(function(property) {
      var value = property.key.type === Syntax.Identifier ?
        property.key.name :
        property.key.value;
      return value !== 'displayName';
    });

    if (safe) {
      utils.catchup(object['arguments'][0].range[0] + 1, state);
      utils.append('displayName: "' + displayName + '",', state);
    }
  }
}

/**
 * Transforms the following:
 *
 * var MyComponent = React.createClass({
 *    render: ...
 * });
 *
 * into:
 *
 * var MyComponent = React.createClass({
 *    displayName: 'MyComponent',
 *    render: ...
 * });
 *
 * Also catches:
 *
 * MyComponent = React.createClass(...);
 * exports.MyComponent = React.createClass(...);
 * module.exports = {MyComponent: React.createClass(...)};
 */
function visitReactDisplayName(traverse, object, path, state) {
  var left, right;

  if (object.type === Syntax.AssignmentExpression) {
    left = object.left;
    right = object.right;
  } else if (object.type === Syntax.Property) {
    left = object.key;
    right = object.value;
  } else if (object.type === Syntax.VariableDeclarator) {
    left = object.id;
    right = object.init;
  }

  if (left && left.type === Syntax.MemberExpression) {
    left = left.property;
  }
  if (left && left.type === Syntax.Identifier) {
    addDisplayName(left.name, right, state);
  }
}

visitReactDisplayName.test = function(object, path, state) {
  return (
    object.type === Syntax.AssignmentExpression ||
    object.type === Syntax.Property ||
    object.type === Syntax.VariableDeclarator
  );
};

exports.visitorList = [
  visitReactDisplayName
];

},{"jstransform":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/jstransform.js","jstransform/src/utils":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/utils.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/vendor/fbtransform/transforms/xjs.js":[function(require,module,exports){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/*global exports:true*/
"use strict";
var Syntax = require('jstransform').Syntax;
var utils = require('jstransform/src/utils');

var knownTags = {
  a: true,
  abbr: true,
  address: true,
  applet: true,
  area: true,
  article: true,
  aside: true,
  audio: true,
  b: true,
  base: true,
  bdi: true,
  bdo: true,
  big: true,
  blockquote: true,
  body: true,
  br: true,
  button: true,
  canvas: true,
  caption: true,
  circle: true,
  cite: true,
  code: true,
  col: true,
  colgroup: true,
  command: true,
  data: true,
  datalist: true,
  dd: true,
  defs: true,
  del: true,
  details: true,
  dfn: true,
  dialog: true,
  div: true,
  dl: true,
  dt: true,
  ellipse: true,
  em: true,
  embed: true,
  fieldset: true,
  figcaption: true,
  figure: true,
  footer: true,
  form: true,
  g: true,
  h1: true,
  h2: true,
  h3: true,
  h4: true,
  h5: true,
  h6: true,
  head: true,
  header: true,
  hgroup: true,
  hr: true,
  html: true,
  i: true,
  iframe: true,
  img: true,
  input: true,
  ins: true,
  kbd: true,
  keygen: true,
  label: true,
  legend: true,
  li: true,
  line: true,
  linearGradient: true,
  link: true,
  main: true,
  map: true,
  mark: true,
  marquee: true,
  mask: false,
  menu: true,
  menuitem: true,
  meta: true,
  meter: true,
  nav: true,
  noscript: true,
  object: true,
  ol: true,
  optgroup: true,
  option: true,
  output: true,
  p: true,
  param: true,
  path: true,
  pattern: false,
  picture: true,
  polygon: true,
  polyline: true,
  pre: true,
  progress: true,
  q: true,
  radialGradient: true,
  rect: true,
  rp: true,
  rt: true,
  ruby: true,
  s: true,
  samp: true,
  script: true,
  section: true,
  select: true,
  small: true,
  source: true,
  span: true,
  stop: true,
  strong: true,
  style: true,
  sub: true,
  summary: true,
  sup: true,
  svg: true,
  table: true,
  tbody: true,
  td: true,
  text: true,
  textarea: true,
  tfoot: true,
  th: true,
  thead: true,
  time: true,
  title: true,
  tr: true,
  track: true,
  tspan: true,
  u: true,
  ul: true,
  'var': true,
  video: true,
  wbr: true
};

function renderXJSLiteral(object, isLast, state, start, end) {
  var lines = object.value.split(/\r\n|\n|\r/);

  if (start) {
    utils.append(start, state);
  }

  var lastNonEmptyLine = 0;

  lines.forEach(function (line, index) {
    if (line.match(/[^ \t]/)) {
      lastNonEmptyLine = index;
    }
  });

  lines.forEach(function (line, index) {
    var isFirstLine = index === 0;
    var isLastLine = index === lines.length - 1;
    var isLastNonEmptyLine = index === lastNonEmptyLine;

    // replace rendered whitespace tabs with spaces
    var trimmedLine = line.replace(/\t/g, ' ');

    // trim whitespace touching a newline
    if (!isFirstLine) {
      trimmedLine = trimmedLine.replace(/^[ ]+/, '');
    }
    if (!isLastLine) {
      trimmedLine = trimmedLine.replace(/[ ]+$/, '');
    }

    if (!isFirstLine) {
      utils.append(line.match(/^[ \t]*/)[0], state);
    }

    if (trimmedLine || isLastNonEmptyLine) {
      utils.append(
        JSON.stringify(trimmedLine) +
        (!isLastNonEmptyLine ? " + ' ' +" : ''),
        state);

      if (isLastNonEmptyLine) {
        if (end) {
          utils.append(end, state);
        }
        if (!isLast) {
          utils.append(', ', state);
        }
      }

      // only restore tail whitespace if line had literals
      if (trimmedLine && !isLastLine) {
        utils.append(line.match(/[ \t]*$/)[0], state);
      }
    }

    if (!isLastLine) {
      utils.append('\n', state);
    }
  });

  utils.move(object.range[1], state);
}

function renderXJSExpressionContainer(traverse, object, isLast, path, state) {
  // Plus 1 to skip `{`.
  utils.move(object.range[0] + 1, state);
  traverse(object.expression, path, state);

  if (!isLast && object.expression.type !== Syntax.XJSEmptyExpression) {
    // If we need to append a comma, make sure to do so after the expression.
    utils.catchup(object.expression.range[1], state, trimLeft);
    utils.append(', ', state);
  }

  // Minus 1 to skip `}`.
  utils.catchup(object.range[1] - 1, state, trimLeft);
  utils.move(object.range[1], state);
  return false;
}

function quoteAttrName(attr) {
  // Quote invalid JS identifiers.
  if (!/^[a-z_$][a-z\d_$]*$/i.test(attr)) {
    return '"' + attr + '"';
  }
  return attr;
}

function trimLeft(value) {
  return value.replace(/^[ ]+/, '');
}

exports.knownTags = knownTags;
exports.renderXJSExpressionContainer = renderXJSExpressionContainer;
exports.renderXJSLiteral = renderXJSLiteral;
exports.quoteAttrName = quoteAttrName;
exports.trimLeft = trimLeft;

},{"jstransform":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/jstransform.js","jstransform/src/utils":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/src/utils.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/vendor/fbtransform/visitors.js":[function(require,module,exports){
/*global exports:true*/
var es6ArrowFunctions = require('jstransform/visitors/es6-arrow-function-visitors');
var es6Classes = require('jstransform/visitors/es6-class-visitors');
var es6Destructuring = require('jstransform/visitors/es6-destructuring-visitors');
var es6ObjectConciseMethod = require('jstransform/visitors/es6-object-concise-method-visitors');
var es6ObjectShortNotation = require('jstransform/visitors/es6-object-short-notation-visitors');
var es6RestParameters = require('jstransform/visitors/es6-rest-param-visitors');
var es6Templates = require('jstransform/visitors/es6-template-visitors');
var es7SpreadProperty = require('jstransform/visitors/es7-spread-property-visitors');
var react = require('./transforms/react');
var reactDisplayName = require('./transforms/reactDisplayName');

/**
 * Map from transformName => orderedListOfVisitors.
 */
var transformVisitors = {
  'es6-arrow-functions': es6ArrowFunctions.visitorList,
  'es6-classes': es6Classes.visitorList,
  'es6-destructuring': es6Destructuring.visitorList,
  'es6-object-concise-method': es6ObjectConciseMethod.visitorList,
  'es6-object-short-notation': es6ObjectShortNotation.visitorList,
  'es6-rest-params': es6RestParameters.visitorList,
  'es6-templates': es6Templates.visitorList,
  'es7-spread-property': es7SpreadProperty.visitorList,
  'react': react.visitorList.concat(reactDisplayName.visitorList)
};

var transformSets = {
  'harmony': [
    'es6-arrow-functions',
    'es6-object-concise-method',
    'es6-object-short-notation',
    'es6-classes',
    'es6-rest-params',
    'es6-templates',
    'es6-destructuring',
    'es7-spread-property'
  ],
  'react': [
    'react'
  ]
};

/**
 * Specifies the order in which each transform should run.
 */
var transformRunOrder = [
  'es6-arrow-functions',
  'es6-object-concise-method',
  'es6-object-short-notation',
  'es6-classes',
  'es6-rest-params',
  'es6-templates',
  'es6-destructuring',
  'es7-spread-property',
  'react'
];

/**
 * Given a list of transform names, return the ordered list of visitors to be
 * passed to the transform() function.
 *
 * @param {array?} excludes
 * @return {array}
 */
function getAllVisitors(excludes) {
  var ret = [];
  for (var i = 0, il = transformRunOrder.length; i < il; i++) {
    if (!excludes || excludes.indexOf(transformRunOrder[i]) === -1) {
      ret = ret.concat(transformVisitors[transformRunOrder[i]]);
    }
  }
  return ret;
}

/**
 * Given a list of visitor set names, return the ordered list of visitors to be
 * passed to jstransform.
 *
 * @param {array}
 * @return {array}
 */
function getVisitorsBySet(sets) {
  var visitorsToInclude = sets.reduce(function(visitors, set) {
    if (!transformSets.hasOwnProperty(set)) {
      throw new Error('Unknown visitor set: ' + set);
    }
    transformSets[set].forEach(function(visitor) {
      visitors[visitor] = true;
    });
    return visitors;
  }, {});

  var visitorList = [];
  for (var i = 0; i < transformRunOrder.length; i++) {
    if (visitorsToInclude.hasOwnProperty(transformRunOrder[i])) {
      visitorList = visitorList.concat(transformVisitors[transformRunOrder[i]]);
    }
  }

  return visitorList;
}

exports.getVisitorsBySet = getVisitorsBySet;
exports.getAllVisitors = getAllVisitors;
exports.transformVisitors = transformVisitors;

},{"./transforms/react":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/vendor/fbtransform/transforms/react.js","./transforms/reactDisplayName":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/vendor/fbtransform/transforms/reactDisplayName.js","jstransform/visitors/es6-arrow-function-visitors":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es6-arrow-function-visitors.js","jstransform/visitors/es6-class-visitors":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es6-class-visitors.js","jstransform/visitors/es6-destructuring-visitors":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es6-destructuring-visitors.js","jstransform/visitors/es6-object-concise-method-visitors":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es6-object-concise-method-visitors.js","jstransform/visitors/es6-object-short-notation-visitors":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es6-object-short-notation-visitors.js","jstransform/visitors/es6-rest-param-visitors":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es6-rest-param-visitors.js","jstransform/visitors/es6-template-visitors":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es6-template-visitors.js","jstransform/visitors/es7-spread-property-visitors":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/react-tools/node_modules/jstransform/visitors/es7-spread-property-visitors.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/index.js":[function(require,module,exports){
var t = require('./lib');

// plug bootstrap skin
t.form.config.templates = require('./lib/skins/bootstrap');

module.exports = t;
},{"./lib":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/index.js","./lib/skins/bootstrap":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/skins/bootstrap/index.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/api.js":[function(require,module,exports){
'use strict';

var React = require('react');
var t = require('tcomb-validation');

var Str = t.Str;
var Bool = t.Bool;
var Func = t.Func;
var Obj = t.Obj;
var maybe = t.maybe;
var list = t.list;
var struct = t.struct;
var union = t.union;

var Auto = t.enums.of('placeholders labels none', 'Auto');
Auto.defaultValue = 'labels';

// internationalization
var I18n = struct({
  add: Str,       // add button for lists
  down: Str,      // move down button for lists
  optional: Str,  // suffix added to optional fields
  remove: Str,    // remove button for lists
  up: Str         // move up button for lists
}, 'I18n');

var Report = struct({
  innerType: maybe(t.Type),
  maybe: maybe(Bool),
  subtype: maybe(Bool),
  type: t.Type
}, 'Report');

var Context = struct({
  auto: Auto,
  config: maybe(Obj),
  i18n: I18n,
  label: maybe(Str), // must be a string because of `i18n.optional` concatenation
  name: maybe(Str),
  report: Report,
  templates: Obj
}, 'Context');

Context.prototype.getDefaultLabel = function () {
  if (!this.label) { return null; }
  return this.label + (this.report.maybe ? this.i18n.optional : '');
};

var ReactElement = t.irreducible('ReactElement', React.isValidElement);

var Label = union([Str, ReactElement], 'Label');

var ErrorMessage = union([Label, Func], 'Error');

var Option = t.struct({
  disabled: maybe(Bool),
  text: Str,
  value: Str
}, 'Option');

var OptGroup = t.struct({
  disabled: maybe(Bool),
  label: Str,
  options: list(Option)
}, 'OptGroup');

var SelectOption = union([Option, OptGroup], 'SelectOption');

SelectOption.dispatch = function (x) {
  if (x.hasOwnProperty('label')) { return OptGroup; }
  return Option;
};

var TypeAttr = t.enums.of('textarea hidden text password color date datetime datetime-local email month number range search tel time url week', 'TypeAttr');

var Transformer = struct({
  format: Func, // from value to string
  parse: Func   // from string to value
}, 'Transformer');

var Textbox = struct({
  autoFocus: maybe(Bool),
  config: maybe(Obj),
  disabled: maybe(Bool),
  error: maybe(ErrorMessage),
  hasError: maybe(Bool),
  help: maybe(Label),
  id: maybe(Str),
  label: maybe(Label),
  name: maybe(t.Str),
  placeholder: maybe(Str),
  template: maybe(Func),
  transformer: maybe(Transformer),
  type: maybe(TypeAttr)
}, 'Textbox');

var Checkbox = struct({
  autoFocus: maybe(Bool),
  config: maybe(Obj),
  disabled: maybe(Bool),
  hasError: maybe(Bool),
  help: maybe(Label),
  id: maybe(Str),
  error: maybe(ErrorMessage),
  label: maybe(Label),
  name: maybe(t.Str),
  template: maybe(Func)
}, 'Checkbox');

function asc(a, b) {
  return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
}

var Order = t.enums({
  asc: asc,
  desc: function desc(a, b) {
    return -asc(a, b);
  }
}, 'Order');

Order.getComparator = function (order) {
  return Order.meta.map[order];
};

// handle multiple attribute
var SelectValue = union([Str, list(Str)], 'SelectValue');

var Select = struct({
  autoFocus: maybe(Bool),
  config: maybe(Obj),
  disabled: maybe(Bool),
  hasError: maybe(Bool),
  help: maybe(Label),
  id: maybe(Str),
  error: maybe(ErrorMessage),
  label: maybe(Label),
  name: maybe(t.Str),
  nullOption: maybe(Option),
  options: maybe(list(SelectOption)),
  order: maybe(Order),
  template: maybe(Func)
}, 'Select');

var Radio = struct({
  autoFocus: maybe(Bool),
  config: maybe(Obj),
  disabled: maybe(Bool),
  hasError: maybe(Bool),
  help: maybe(Label),
  id: maybe(Str),
  error: maybe(ErrorMessage),
  label: maybe(Label),
  name: maybe(t.Str),
  options: maybe(list(SelectOption)),
  order: maybe(Order),
  template: maybe(Func)
}, 'Select');

var Struct = struct({
  auto: maybe(Auto),
  config: maybe(Obj),
  disabled: maybe(Bool),
  fields: maybe(Obj),
  i18n: maybe(I18n),
  hasError: maybe(Bool),
  help: maybe(Label),
  error: maybe(ErrorMessage),
  legend: maybe(Label),
  order: maybe(list(Label)),
  templates: maybe(Obj)
}, 'Struct');

var List = struct({
  auto: maybe(Auto),
  config: maybe(Obj),
  disableAdd: maybe(Bool),
  disableRemove: maybe(Bool),
  disableOrder: maybe(Bool),
  disabled: maybe(Bool),
  i18n: maybe(I18n),
  item: maybe(Obj),
  hasError: maybe(Bool),
  help: maybe(Label),
  error: maybe(ErrorMessage),
  legend: maybe(Label),
  templates: maybe(Obj)
}, 'List');

module.exports = {
  Auto: Auto,
  I18n: I18n,
  Context: Context,
  ReactElement: ReactElement,
  Label: Label,
  ErrorMessage: ErrorMessage,
  Option: Option,
  OptGroup: OptGroup,
  SelectOption: SelectOption,
  Transformer: Transformer,
  Order: Order,
  Textbox: Textbox,
  Checkbox: Checkbox,
  Select: Select,
  SelectValue: SelectValue,
  Radio: Radio,
  Struct: Struct,
  List: List
};
},{"react":"react","tcomb-validation":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/index.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/Checkbox.js":[function(require,module,exports){
'use strict';

var React = require('react');
var t = require('tcomb-validation');
var api = require('../api');
var skin = require('../skin');
var shouldComponentUpdate = require('./shouldComponentUpdate');
var getError = require('../util/getError');
var merge = require('../util/merge');
var uuid = require('../util/uuid');
var compile = require('uvdom/react').compile;
var debug = require('debug')('component:Checkbox');

function normalize(value) {
  return !!t.maybe(t.Bool)(value);
}

var Checkbox = React.createClass({

  displayName: 'Checkbox',

  getInitialState: function () {
    return {
      hasError: false,
      value: normalize(this.props.value)
    };
  },

  componentWillReceiveProps: function (props) {
    this.setState({value: normalize(props.value)});
  },

  shouldComponentUpdate: shouldComponentUpdate,

  onChange: function (value) {
    value = normalize(value);
    this.props.onChange(value);
    this.setState({value: value});
  },

  getValue: function () {
    var result = t.validate(this.state.value, this.props.ctx.report.type);
    this.setState({hasError: !result.isValid()});
    return result;
  },

  getLocals: function () {
    var opts = new api.Checkbox(this.props.options || {});
    var ctx = this.props.ctx;
    t.assert(!ctx.report.maybe, 'maybe booleans are not supported');
    t.assert(ctx.report.innerType === t.Bool, 'checkboxes support only booleans');
    var id = opts.id || this._rootNodeID || uuid();
    var name = opts.name || ctx.name || id;
    debug('render() called for `%s` field', name);

    // handle labels
    var label = opts.label || ctx.getDefaultLabel(); // checkboxes must have a label

    var value = this.state.value;
    return {
      autoFocus: opts.autoFocus,
      config: merge(ctx.config, opts.config),
      disabled: opts.disabled,
      error: getError(opts.error, value),
      hasError: opts.hasError || this.state.hasError,
      help: opts.help,
      id: id,
      label: label,
      name: name,
      onChange: this.onChange,
      value: value,
      template: opts.template || ctx.templates.checkbox
    };
  },

  render: function () {
    var locals = this.getLocals();
    return compile(locals.template(new skin.Checkbox(locals)));
  }

});

module.exports = Checkbox;
},{"../api":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/api.js","../skin":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/skin.js","../util/getError":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/getError.js","../util/merge":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/merge.js","../util/uuid":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/uuid.js","./shouldComponentUpdate":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/shouldComponentUpdate.js","debug":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/debug/browser.js","react":"react","tcomb-validation":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/index.js","uvdom/react":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom/react.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/Form.js":[function(require,module,exports){
'use strict';

var React = require('react');
var getComponent = require('../getComponent');
var api = require('../api');
var getReport = require('../util/getReport');
var config =  require('../config');

function noop() {}

var Form = React.createClass({

  displayName: 'Form',

  // the public api returns `null` if validation failed
  // unless the optional boolean argument `raw` is set to `true`
  getValue: function (raw) {
    var result = this.refs.input.getValue();
    if (raw === true) { return result; }
    if (result.isValid()) { return result.value; }
    return null;
  },

  render: function () {
    var type = this.props.type;
    var options = this.props.options;
    var ctx = new api.Context({
      auto: api.Auto.defaultValue,
      i18n: config.i18n,
      report: getReport(type),
      templates: config.templates
    });
    var factory = React.createFactory(getComponent(type, options));
    return factory({
      ref: 'input',
      options: options,
      value: this.props.value,
      onChange: this.props.onChange || noop,
      ctx: ctx
    });
  }

});

module.exports = Form;
},{"../api":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/api.js","../config":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/config.js","../getComponent":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/getComponent.js","../util/getReport":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/getReport.js","react":"react"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/List.js":[function(require,module,exports){
'use strict';

var React = require('react');
var t = require('tcomb-validation');
var shouldComponentUpdate = require('./shouldComponentUpdate');
var getComponent = require('../getComponent');
var api = require('../api');
var skin = require('../skin');
var getError = require('../util/getError');
var merge = require('../util/merge');
var move = require('../util/move');
var uuid = require('../util/uuid');
var getReport = require('../util/getReport');
var compile = require('uvdom/react').compile;
var debug = require('debug')('component:List');

function justify(value, keys) {
  if (value.length === keys.length) { return keys; }
  var ret = [];
  for (var i = 0, len = value.length ; i < len ; i++ ) {
    ret[i] = keys[i] || uuid();
  }
  return ret;
}

function normalize(value) {
  t.maybe(t.Arr)(value);
  return value || [];
}

var List = React.createClass({

  displayName: 'List',

  getInitialState: function () {
    var value = normalize(this.props.value);
    return {
      hasError: false,
      value: value,
      keys: value.map(uuid)
    };
  },

  componentWillReceiveProps: function (props) {
    var value = normalize(props.value);
    this.setState({
      value: value,
      keys: justify(value, this.state.keys)
    });
  },

  shouldComponentUpdate: shouldComponentUpdate,

  onChange: function (value, keys) {
    this.props.onChange(value);
    this.setState({value: value, keys: keys});
  },

  getValue: function () {
    var report = this.props.ctx.report;
    var value = [];
    var errors = [];
    var hasError = false;
    var result;

    for (var i = 0, len = this.state.value.length ; i < len ; i++ ) {
      result = this.refs[i].getValue();
      errors = errors.concat(result.errors);
      value.push(result.value);
    }

    // handle subtype
    if (report.subtype && errors.length === 0) {
      result = t.validate(value, report.type);
      hasError = !result.isValid();
      errors = errors.concat(result.errors);
    }

    this.setState({hasError: hasError});
    return new t.ValidationResult({errors: errors, value: value});
  },

  addItem: function (evt) {
    evt.preventDefault();
    var value = this.state.value.concat(null);
    var keys = this.state.keys.concat(uuid());
    this.onChange(value, keys);
  },

  onItemChange: function (itemIndex, itemValue) {
    var value = this.state.value.slice();
    value[itemIndex] = itemValue;
    this.onChange(value, this.state.keys);
  },

  removeItem: function (i, evt) {
    evt.preventDefault();
    var value = this.state.value.slice();
    value.splice(i, 1);
    var keys = this.state.keys.slice();
    keys.splice(i, 1);
    this.onChange(value, keys);
  },

  moveUpItem: function (i, evt) {
    evt.preventDefault();
    if (i > 0) {
      this.onChange(
        move(this.state.value.slice(), i, i - 1),
        move(this.state.keys.slice(), i, i - 1)
      );
    }
  },

  moveDownItem: function (i, evt) {
    evt.preventDefault();
    if (i < this.state.value.length - 1) {
      this.onChange(
        move(this.state.value.slice(), i, i + 1),
        move(this.state.keys.slice(), i, i + 1)
      );
    }
  },

  getLocals: function () {
    var opts = new api.List(this.props.options || {});
    var ctx = this.props.ctx;
    debug('render() called for `%s` field', ctx.name);
    t.assert(!ctx.report.maybe, 'maybe lists are not supported');
    var auto = opts.auto || ctx.auto;
    var i18n = opts.i18n || ctx.i18n;
    var value = t.Arr(this.state.value || []);

    // handle legend
    var legend = opts.legend; // always use the option value if is manually set
    if (!legend && ctx.auto === 'labels') {
      // add automatically a legend only if there is not a legend
      // and the 'labels' auto option is turned on
      legend = ctx.getDefaultLabel();
    }

    var config = merge(ctx.config, opts.config);
    var templates = merge(ctx.templates, opts.templates);
    var itemType = ctx.report.innerType.meta.type;
    var factory = React.createFactory(getComponent(itemType, opts.item));
    var items = value.map(function (value, i) {
      var buttons = [];
      if (!opts.disableRemove) { buttons.push({ label: i18n.remove, click: this.removeItem.bind(this, i) }); }
      if (!opts.disableOrder)   { buttons.push({ label: i18n.up, click: this.moveUpItem.bind(this, i) }); }
      if (!opts.disableOrder)   { buttons.push({ label: i18n.down, click: this.moveDownItem.bind(this, i) }); }
      return {
        input: factory({
          ref: i,
          type: itemType,
          options: opts.item,
          value: value,
          onChange: this.onItemChange.bind(this, i),
          ctx: new api.Context({
            auto:       auto,
            config:     config,
            i18n:       i18n,
            label:      null,
            name:       ctx.name + '[' + i + ']',
            report:     new getReport(itemType),
            templates:  templates
          })
        }),
        key: this.state.keys[i],
        buttons: buttons
      };
    }.bind(this));
    return {
      add: opts.disableAdd ? null : {
        label: i18n.add,
        click: this.addItem
      },
      config: config,
      disabled: opts.disabled,
      error: getError(opts.error, value),
      hasError: opts.hasError || this.state.hasError,
      help: opts.help,
      items: items,
      legend: legend,
      value: value,
      templates: templates
    };
  },

  render: function () {
    var locals = this.getLocals();
    return compile(locals.templates.list(new skin.List(locals)));
  }

});

module.exports = List;

},{"../api":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/api.js","../getComponent":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/getComponent.js","../skin":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/skin.js","../util/getError":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/getError.js","../util/getReport":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/getReport.js","../util/merge":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/merge.js","../util/move":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/move.js","../util/uuid":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/uuid.js","./shouldComponentUpdate":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/shouldComponentUpdate.js","debug":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/debug/browser.js","react":"react","tcomb-validation":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/index.js","uvdom/react":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom/react.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/Radio.js":[function(require,module,exports){
'use strict';

var React = require('react');
var t = require('tcomb-validation');
var api = require('../api');
var skin = require('../skin');
var shouldComponentUpdate = require('./shouldComponentUpdate');
var getError = require('../util/getError');
var merge = require('../util/merge');
var uuid = require('../util/uuid');
var getOptionsOfEnum = require('../util/getOptionsOfEnum');
var compile = require('uvdom/react').compile;
var debug = require('debug')('component:Radio');

function normalize(value) {
  return t.maybe(api.SelectValue)(value);
}

var Radio = React.createClass({

  displayName: 'Radio',

  getInitialState: function () {
    return {
      hasError: false,
      value: normalize(this.props.value)
    };
  },

  componentWillReceiveProps: function (props) {
    this.setState({value: normalize(props.value)});
  },

  shouldComponentUpdate: shouldComponentUpdate,

  onChange: function (value) {
    value = normalize(value);
    this.props.onChange(value);
    this.setState({value: value});
  },

  getValue: function () {
    var result = t.validate(this.state.value, this.props.ctx.report.type);
    this.setState({hasError: !result.isValid()});
    return result;
  },

  getLocals: function () {
    var opts = new api.Radio(this.props.options || {});
    var ctx = this.props.ctx;
    var id = opts.id || this._rootNodeID || uuid();
    var name = opts.name || ctx.name || id;
    debug('render() called for `%s` field', name);

    // handle labels
    var label = opts.label; // always use the option value if is manually set
    if (!label && ctx.auto === 'labels') {
      // add automatically a label only if there is not a label
      // and the 'labels' auto option is turned on
      label = ctx.getDefaultLabel();
    }

    var options = opts.options ? opts.options.slice() : getOptionsOfEnum(ctx.report.innerType);
    // sort opts
    if (opts.order) {
      options.sort(api.Order.getComparator(opts.order));
    }
    var value = this.state.value;
    return {
      autoFocus: opts.autoFocus,
      config: merge(ctx.config, opts.config),
      disabled: opts.disabled,
      error: getError(opts.error, value),
      hasError: opts.hasError || this.state.hasError,
      help: opts.help,
      id: id,
      label: label,
      name: name,
      onChange: this.onChange,
      options: options,
      value: value,
      template: opts.template || ctx.templates.radio
    };
  },

  render: function () {
    var locals = this.getLocals();
    return compile(locals.template(new skin.Radio(locals)));
  }

});

module.exports = Radio;
},{"../api":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/api.js","../skin":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/skin.js","../util/getError":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/getError.js","../util/getOptionsOfEnum":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/getOptionsOfEnum.js","../util/merge":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/merge.js","../util/uuid":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/uuid.js","./shouldComponentUpdate":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/shouldComponentUpdate.js","debug":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/debug/browser.js","react":"react","tcomb-validation":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/index.js","uvdom/react":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom/react.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/Select.js":[function(require,module,exports){
'use strict';

var React = require('react');
var t = require('tcomb-validation');
var api = require('../api');
var skin = require('../skin');
var shouldComponentUpdate = require('./shouldComponentUpdate');
var getError = require('../util/getError');
var getReport = require('../util/getReport');
var merge = require('../util/merge');
var uuid = require('../util/uuid');
var getOptionsOfEnum = require('../util/getOptionsOfEnum');
var compile = require('uvdom/react').compile;
var debug = require('debug')('component:Select');

function normalize(value) {
  return t.maybe(api.SelectValue)(value);
}

var Select = React.createClass({

  displayName: 'Select',

  getInitialState: function () {
    return {
      hasError: false,
      value: normalize(this.props.value)
    };
  },

  componentWillReceiveProps: function (props) {
    this.setState({value: normalize(props.value)});
  },

  shouldComponentUpdate: shouldComponentUpdate,

  onChange: function (value) {
    value = normalize(value);
    this.props.onChange(value);
    this.setState({value: value});
  },

  getValue: function () {
    var result = t.validate(this.state.value, this.props.ctx.report.type);
    this.setState({hasError: !result.isValid()});
    return result;
  },

  getLocals: function () {
    var opts = new api.Select(this.props.options || {});
    var ctx = this.props.ctx;
    var id = opts.id || this._rootNodeID || uuid();
    var name = opts.name || ctx.name || id;
    debug('render() called for `%s` field', name);
    var Enum = ctx.report.innerType;
    // handle `multiple` attribute
    var multiple = false;
    if (Enum.meta.kind === 'list') {
      multiple = true;
      Enum = getReport(Enum.meta.type).innerType;
    }

    // handle labels
    var label = opts.label; // always use the option value if is manually set
    if (!label && ctx.auto === 'labels') {
      // add automatically a label only if there is not a label
      // and the 'labels' auto option is turned on
      label = ctx.getDefaultLabel();
    }

    var value = this.state.value;
    var options = opts.options ? opts.options.slice() : getOptionsOfEnum(Enum);
    // sort opts
    if (opts.order) {
      options.sort(api.Order.getComparator(opts.order));
    }
    // add a `null` option in first position
    var nullOption = opts.nullOption || {value: '', text: '-'};
    if (!multiple) {
      options.unshift(nullOption);
    }
    return {
      autoFocus: opts.autoFocus,
      config: merge(ctx.config, opts.config),
      disabled: opts.disabled,
      error: getError(opts.error, value),
      hasError: opts.hasError || this.state.hasError,
      help: opts.help,
      id: id,
      label: label,
      name: name,
      multiple: multiple,
      onChange: function (value) {
        if (value === nullOption.value) {
          value = null;
        }
        this.onChange(value);
      }.bind(this),
      options: options,
      value: value,
      template: opts.template || ctx.templates.select
    };
  },

  render: function () {
    var locals = this.getLocals();
    return compile(locals.template(new skin.Select(locals)));
  }

});

module.exports = Select;
},{"../api":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/api.js","../skin":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/skin.js","../util/getError":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/getError.js","../util/getOptionsOfEnum":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/getOptionsOfEnum.js","../util/getReport":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/getReport.js","../util/merge":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/merge.js","../util/uuid":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/uuid.js","./shouldComponentUpdate":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/shouldComponentUpdate.js","debug":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/debug/browser.js","react":"react","tcomb-validation":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/index.js","uvdom/react":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom/react.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/Struct.js":[function(require,module,exports){
'use strict';

var React = require('react');
var t = require('tcomb-validation');
var shouldComponentUpdate = require('./shouldComponentUpdate');
var getComponent = require('../getComponent');
var api = require('../api');
var skin = require('../skin');
var getError = require('../util/getError');
var merge = require('../util/merge');
var humanize = require('../util/humanize');
var getReport = require('../util/getReport');
var compile = require('uvdom/react').compile;
var debug = require('debug')('component:Struct');

function normalize(value) {
  t.maybe(t.Obj)(value);
  return value || {};
}

var Struct = React.createClass({

  displayName: 'Struct',

  getInitialState: function () {
    return {
      hasError: false,
      value: normalize(this.props.value)
    };
  },

  componentWillReceiveProps: function (props) {
    this.setState({value: normalize(props.value)});
  },

  shouldComponentUpdate: shouldComponentUpdate,

  onChange: function (fieldName, fieldValue) {
    var value = t.mixin({}, this.state.value);
    value[fieldName] = fieldValue;
    this.props.onChange(value);
    this.setState({value: value});
  },

  getValue: function () {
    var report = this.props.ctx.report;
    var value = {};
    var errors = [];
    var hasError = false;
    var result;

    for (var ref in this.refs) {
      if (this.refs.hasOwnProperty(ref)) {
        result = this.refs[ref].getValue();
        errors = errors.concat(result.errors);
        value[ref] = result.value;
      }
    }

    if (errors.length === 0) {
      value = new report.innerType(value);
      // handle subtype
      if (report.subtype && errors.length === 0) {
        result = t.validate(value, report.type);
        hasError = !result.isValid();
        errors = errors.concat(result.errors);
      }
    }

    this.setState({hasError: hasError});
    return new t.ValidationResult({errors: errors, value: value});
  },

  getLocals: function () {
    var opts = new api.Struct(this.props.options || {});
    var ctx = this.props.ctx;
    debug('render() called for `%s` field', ctx.name);
    t.assert(!ctx.report.maybe, 'maybe structs are not supported');
    var auto =  opts.auto || ctx.auto;

    // handle legend
    var legend = opts.legend; // always use the option value if is manually set
    if (!legend && ctx.auto === 'labels') {
      // add automatically a legend only if there is not a legend
      // and the 'labels' auto option is turned on
      legend = ctx.getDefaultLabel();
    }

    var config = merge(ctx.config, opts.config);
    var value = this.state.value;
    var props = ctx.report.innerType.meta.props;
    var i18n =  opts.i18n || ctx.i18n;
    var templates = merge(ctx.templates, opts.templates);
    var inputs = {};
    for (var prop in props) {
      if (props.hasOwnProperty(prop)) {
        var propType = props[prop];
        var propOptions = opts.fields ? opts.fields[prop] : null;
        inputs[prop] = React.createFactory(getComponent(propType, propOptions))({
          key: prop,
          ref: prop,
          type: propType,
          options: propOptions,
          value: value[prop],
          onChange: this.onChange.bind(this, prop),
          ctx: new api.Context({
            auto:       auto,
            config:     config,
            i18n:       i18n,
            label:      humanize(prop),
            name:       ctx.name ? ctx.name + '[' + prop + ']' : prop,
            report:     new getReport(propType),
            templates:  templates
          })
        });
      }
    }
    return {
      config: config,
      disabled: opts.disabled,
      error: getError(opts.error, value),
      hasError: opts.hasError || this.state.hasError,
      help: opts.help,
      inputs: inputs,
      legend: legend,
      order: opts.order || Object.keys(props),
      value: value,
      templates: templates
    };
  },

  render: function () {
    var locals = this.getLocals();
    return compile(locals.templates.struct(new skin.Struct(locals)));
  }

});

module.exports = Struct;
},{"../api":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/api.js","../getComponent":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/getComponent.js","../skin":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/skin.js","../util/getError":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/getError.js","../util/getReport":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/getReport.js","../util/humanize":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/humanize.js","../util/merge":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/merge.js","./shouldComponentUpdate":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/shouldComponentUpdate.js","debug":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/debug/browser.js","react":"react","tcomb-validation":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/index.js","uvdom/react":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom/react.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/Textbox.js":[function(require,module,exports){
'use strict';

var React = require('react');
var t = require('tcomb-validation');
var api = require('../api');
var skin = require('../skin');
var shouldComponentUpdate = require('./shouldComponentUpdate');
var getError = require('../util/getError');
var merge = require('../util/merge');
var uuid = require('../util/uuid');
var config = require('../config');
var compile = require('uvdom/react').compile;
var debug = require('debug')('component:Textbox');

function normalize(value) {
  return (t.Str.is(value) && value.trim() === '') ? null :
    !t.Nil.is(value) ? value :
    null;
}

var Textbox = React.createClass({

  displayName: 'Textbox',

  getInitialState: function () {
    return {
      hasError: false,
      value: normalize(this.props.value)
    };
  },

  componentWillReceiveProps: function (props) {
    this.setState({value: normalize(props.value)});
  },

  shouldComponentUpdate: shouldComponentUpdate,

  onChange: function (value) {
    value = normalize(value);
    this.props.onChange(value);
    this.setState({value: value});
  },

  getValue: function () {
    var result = t.validate(this.state.value, this.props.ctx.report.type);
    this.setState({hasError: !result.isValid()});
    return result;
  },

  // useful for tests
  getLocals: function () {
    var opts = new api.Textbox(this.props.options || {});
    var ctx = this.props.ctx;
    var id = opts.id || this._rootNodeID || uuid();
    var name = opts.name || ctx.name || id;
    debug('render() called for `%s` field', name);

    // handle labels
    var label = opts.label; // always use the option value if is manually set
    if (!label && ctx.auto === 'labels') {
      // add automatically a label only if there is not a label
      // and the 'labels' auto option is turned on
      label = ctx.getDefaultLabel();
    }

    // handle placeholders
    var placeholder = opts.placeholder; // always use the option value if is manually set
    if (!label && !placeholder && ctx.auto === 'placeholders') {
      // add automatically a placeholder only if there is not a label
      // nor a placeholder manually set and the 'placeholders' auto option is turned on
      placeholder = ctx.getDefaultLabel();
    }

    var value = this.state.value;
    var transformer = opts.transformer || config.transformers[t.getTypeName(ctx.report.innerType)];
    if (transformer) {
      value = transformer.format(value);
    }
    return {
      autoFocus: opts.autoFocus,
      config: merge(ctx.config, opts.config),
      disabled: opts.disabled,
      error: getError(opts.error, value),
      hasError: opts.hasError || this.state.hasError,
      help: opts.help,
      id: id,
      label: label,
      name: name,
      onChange: function (value) {
        if (transformer) {
          value = transformer.parse(value);
        }
        this.onChange(value);
      }.bind(this),
      placeholder: placeholder,
      type: opts.type || 'text',
      value: value,
      template: opts.template || ctx.templates.textbox
    };
  },

  render: function () {
    var locals = this.getLocals();
    return compile(locals.template(new skin.Textbox(locals)));
  }

});

module.exports = Textbox;
},{"../api":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/api.js","../config":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/config.js","../skin":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/skin.js","../util/getError":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/getError.js","../util/merge":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/merge.js","../util/uuid":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/uuid.js","./shouldComponentUpdate":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/shouldComponentUpdate.js","debug":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/debug/browser.js","react":"react","tcomb-validation":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/index.js","uvdom/react":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom/react.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/shouldComponentUpdate.js":[function(require,module,exports){
'use strict';

module.exports = function (nextProps, nextState) {
  return nextState.value !== this.state.value ||
    nextState.hasError !== this.state.hasError ||
    nextProps.value !== this.props.value ||
    nextProps.options !== this.props.options ||
    nextProps.ctx.report.type !== this.props.ctx.report.type;
};
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/config.js":[function(require,module,exports){
'use strict';

var api = require('./api');
var t = require('tcomb-validation');

var defaultLocaleBundle = new api.I18n({
  optional: ' (optional)',
  add: 'Add',
  remove: 'Remove',
  up: 'Up',
  down: 'Down'
});

var NumberTransformer = new api.Transformer({
  format: function (value) {
    return t.Nil.is(value) ? value : String(value);
  },
  parse: function (value) {
    var n = parseFloat(value);
    var isNumeric = (value - n + 1) >= 0;
    return isNumeric ? n : value;
  }
});

module.exports = {
  i18n: defaultLocaleBundle,
  transformers: {
    Num: NumberTransformer
  },
  irreducibles: {
    Bool: require('./components/Checkbox')
  }
};
},{"./api":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/api.js","./components/Checkbox":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/Checkbox.js","tcomb-validation":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/index.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/getComponent.js":[function(require,module,exports){
'use strict';

var t = require('tcomb-validation');
var config = require('./config');

// here requires must be dynamic since there is a circular
// dependency between getComponent and the components
function getComponent(type, options) {
  if (options && options.factory) {
    return options.factory;
  }
  switch (type.meta.kind) {
    case 'irreducible' :
      var name = t.getTypeName(type);
      if (t.Func.is(config.irreducibles[name])) {
        return config.irreducibles[name];
      }
      // fallback on textbox
      return require('./components/Textbox');
    case 'struct' :
      return require('./components/Struct');
    case 'enums' :
      return require('./components/Select');
    case 'list' :
      return require('./components/List');
    case 'maybe' :
    case 'subtype' :
      return getComponent(type.meta.type, options);
  }
}

module.exports = getComponent;
},{"./components/List":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/List.js","./components/Select":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/Select.js","./components/Struct":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/Struct.js","./components/Textbox":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/Textbox.js","./config":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/config.js","tcomb-validation":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/index.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/index.js":[function(require,module,exports){
var t = require('tcomb-validation');

t.form = {
  debug:    require('debug'),
  config:   require('./config'),
  Form:     require('./components/Form'),
  Textbox:  require('./components/Textbox'),
  Select:   require('./components/Select'),
  Checkbox: require('./components/Checkbox'),
  Radio:    require('./components/Radio'),
  Struct:   require('./components/Struct'),
  List:     require('./components/List')
};

module.exports = t;
},{"./components/Checkbox":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/Checkbox.js","./components/Form":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/Form.js","./components/List":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/List.js","./components/Radio":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/Radio.js","./components/Select":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/Select.js","./components/Struct":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/Struct.js","./components/Textbox":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/components/Textbox.js","./config":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/config.js","debug":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/debug/browser.js","tcomb-validation":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/index.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/skin.js":[function(require,module,exports){
'use strict';

var React = require('react');
var t = require('tcomb-validation');
var Str = t.Str;
var Bool = t.Bool;
var Func = t.Func;
var Obj = t.Obj;
var maybe = t.maybe;
var list = t.list;
var struct = t.struct;
var union = t.union;

var ReactElement = t.irreducible('ReactElement', React.isValidElement);

var Label = union([Str, ReactElement], 'Label');

var Option = t.struct({
  disabled: maybe(Bool),
  text: Str,
  value: Str
}, 'Option');

var OptGroup = t.struct({
  disabled: maybe(Bool),
  label: Str,
  options: list(Option)
}, 'OptGroup');

var SelectOption = union([Option, OptGroup], 'SelectOption');

SelectOption.dispatch = function (x) {
  if (x.hasOwnProperty('label')) { return OptGroup; }
  return Option;
};

var TypeAttr = t.enums.of('textarea hidden text password color date datetime datetime-local email month number range search tel time url week', 'TypeAttr');

var Textbox = struct({
  autoFocus: maybe(Bool),
  config: maybe(Obj),
  disabled: maybe(Bool),    // should be disabled
  error: maybe(Label),      // should show an error
  hasError: maybe(Bool),    // if true should show an error state
  help: maybe(Label),       // should show an help message
  id: Str,                  // should use this as id attribute and as htmlFor label attribute
  label: maybe(Label),      // should show a label
  name: Str,                // should use this as name attribute
  onChange: Func,           // should call this function with the changed value
  placeholder: maybe(Str),  // should show a placeholder
  type: TypeAttr,           // should use this as type attribute
  value: t.Any              // should use this as value attribute
}, 'Textbox');

var Checkbox = struct({
  autoFocus: maybe(Bool),
  config: maybe(Obj),
  disabled: maybe(Bool),
  error: maybe(Label),
  hasError: maybe(Bool),
  help: maybe(Label),
  id: Str,                  // should use this as id attribute and as htmlFor label attribute
  label: Label,             // checkboxes must always have a label
  name: Str,
  onChange: Func,
  value: Bool
}, 'Checkbox');

// handle multiple attribute
var SelectValue = union([Str, list(Str)], 'SelectValue');

var Select = struct({
  autoFocus: maybe(Bool),
  config: maybe(Obj),
  error: maybe(Label),
  disabled: maybe(Bool),
  hasError: maybe(Bool),
  help: maybe(Label),
  id: Str,                  // should use this as id attribute and as htmlFor label attribute
  label: maybe(Label),
  multiple: maybe(Bool),
  name: Str,
  onChange: Func,
  options: list(SelectOption),
  value: maybe(SelectValue)
}, 'Select');

var Radio = struct({
  autoFocus: maybe(Bool),
  config: maybe(Obj),
  disabled: maybe(Bool),
  error: maybe(Label),
  hasError: maybe(Bool),
  help: maybe(Label),
  id: Str,
  label: maybe(Label),
  name: Str,
  onChange: Func,
  options: list(Option),
  value: maybe(Str)
}, 'Radio');

var StructValue = t.dict(Str, t.Any, 'StructValue');

var Struct = struct({
  config: maybe(Obj),
  disabled: maybe(Bool),
  error: maybe(Label),
  help: maybe(Label),
  hasError: maybe(Bool),
  inputs: t.dict(Str, ReactElement),
  legend: maybe(Label),
  order: list(Label),
  value: maybe(StructValue)
}, 'Struct');

var Button = struct({
  click: Func,
  label: Str
}, 'Button');

var ListItem = struct({
  buttons: list(Button),
  input: ReactElement,
  key: Str
}, 'ListItem');

var List = struct({
  add: maybe(Button),
  config: maybe(Obj),
  disabled: maybe(Bool),
  error: maybe(Label),
  hasError: maybe(Bool),
  help: maybe(Label),
  items: list(ListItem),
  legend: maybe(Label),
  value: maybe(list(t.Any))
}, 'List');

module.exports = {
  Label: Label,
  Textbox: Textbox,
  Checkbox: Checkbox,
  Option: Option,
  OptGroup: OptGroup,
  Select: Select,
  Radio: Radio,
  Struct: Struct,
  List: List
};
},{"react":"react","tcomb-validation":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/index.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/skins/bootstrap/index.js":[function(require,module,exports){
'use strict';

var t = require('tcomb-validation');
var skin = require('../../skin');
var Label = skin.Label;
var uform = require('uvdom-bootstrap/form');
var maybe = t.maybe;
var getFieldset = uform.getFieldset;
var getFormGroup = uform.getFormGroup;
var getAddon = uform.getAddon;
var getButton = uform.getButton;
var getCol = uform.getCol;
var getAlert = uform.getAlert;
var getBreakpoints = uform.getBreakpoints;

var Positive = t.subtype(t.Num, function (n) {
  return n % 1 === 0 && n >= 0;
}, 'Positive');

var Cols = t.subtype(t.tuple([Positive, Positive]), function (cols) {
  return cols[0] + cols[1] === 12;
}, 'Cols');

var Breakpoints = t.struct({
  xs: maybe(Cols),
  sm: maybe(Cols),
  md: maybe(Cols),
  lg: maybe(Cols)
}, 'Breakpoints');

Breakpoints.prototype.getBreakpoints = function (index) {
  var breakpoints = {};
  for (var size in this) {
    if (this.hasOwnProperty(size) && !t.Nil.is(this[size])) {
      breakpoints[size] = this[size][index];
    }
  }
  return breakpoints;
};

Breakpoints.prototype.getLabelClassName = function () {
  return getBreakpoints(this.getBreakpoints(0));
};

Breakpoints.prototype.getInputClassName = function () {
  return getBreakpoints(this.getBreakpoints(1));
};

Breakpoints.prototype.getOffsetClassName = function () {
  return t.mixin(uform.getOffsets(this.getBreakpoints(1)), getBreakpoints(this.getBreakpoints(1)));
};

Breakpoints.prototype.getFieldsetClassName = function () {
  return {
    'col-xs-12': true
  };
};

var Size = t.enums.of('xs sm md lg', 'Size');

var TextboxConfig = t.struct({
  addonBefore: maybe(Label),
  addonAfter: maybe(Label),
  horizontal: maybe(Breakpoints),
  size: maybe(Size)
}, 'TextboxConfig');

var CheckboxConfig = t.struct({
  horizontal: maybe(Breakpoints)
}, 'CheckboxConfig');

var SelectConfig = t.struct({
  addonBefore: maybe(Label),
  addonAfter: maybe(Label),
  horizontal: maybe(Breakpoints),
  size: maybe(Size)
}, 'SelectConfig');

var RadioConfig = t.struct({
  horizontal: maybe(Breakpoints)
}, 'RadioConfig');

var StructConfig = t.struct({
  horizontal: maybe(Breakpoints)
}, 'StructConfig');

var ListConfig = t.struct({
  horizontal: maybe(Breakpoints)
}, 'ListConfig');

function getLabel(opts) {
  if (!opts.label) { return; }

  var align = null;
  var className = null;

  if (opts.breakpoints) {
    align = 'right';
    className = opts.breakpoints.getLabelClassName();
  }

  return uform.getLabel({
    align: align,
    className: className,
    htmlFor: opts.htmlFor,
    id: opts.id,
    label: opts.label
  });
}

function getHelp(locals) {
  if (!locals.help) { return; }
  return uform.getHelpBlock({
    help: locals.help,
    id: locals.id + '-tip'
  });
}

function getError(locals) {
  if (!locals.hasError || !locals.error) { return; }
  return uform.getErrorBlock({
    error: locals.error,
    hasError: locals.hasError
  });
}

function getHiddenTextbox(locals) {
  return {
    tag: 'input',
    attrs: {
      type: 'hidden',
      value: locals.value,
      name: locals.name
    },
    events: {
      change: function (evt) {
        locals.onChange(evt.target.value);
      }
    }
  };
}

function textbox(locals) {

  var config = new TextboxConfig(locals.config || {});

  if (locals.type === 'hidden') {
    return getHiddenTextbox(locals);
  }

  var control = uform.getTextbox({
    autoFocus: locals.autoFocus,
    type: locals.type,
    value: locals.value,
    disabled: locals.disabled,
    'aria-describedby': locals.help ? locals.id + '-tip' : null,
    id: locals.label ? locals.id : null,
    onChange: function (evt) {
      locals.onChange(evt.target.value);
    },
    placeholder: locals.placeholder,
    name: locals.name,
    size: config.size
  });

  if (config.addonBefore || config.addonAfter) {
    control = uform.getInputGroup([
      config.addonBefore ? getAddon(config.addonBefore) : null,
      control,
      config.addonAfter ? getAddon(config.addonAfter) : null
    ]);
  }

  var horizontal = config.horizontal;
  var label = getLabel({
    label: locals.label,
    htmlFor: locals.id,
    breakpoints: config.horizontal
  });
  var error = getError(locals);
  var help = getHelp(locals);

  var children = [
    label,
    control,
    error,
    help
  ];

  if (horizontal) {
    children = [
      label,
      {
        tag: 'div',
        attrs: {
          className: label ? horizontal.getInputClassName() : horizontal.getOffsetClassName()
        },
        children: [
          control,
          error,
          help
        ]
      }
    ];
  }

  return getFormGroup({
    hasError: locals.hasError,
    children: children
  });
}

function checkbox(locals) {

  var config = new CheckboxConfig(locals.config || {});

  var control = uform.getCheckbox({
    autoFocus: locals.autoFocus,
    checked: locals.value,
    disabled: locals.disabled,
    id: locals.id,
    label: locals.label,
    name: locals.name,
    onChange: function (evt) {
      locals.onChange(evt.target.checked);
    }
  });

  var error = getError(locals);
  var help = getHelp(locals);
  var children = [
    control,
    error,
    help
  ];

  if (config.horizontal) {
    children = {
      tag: 'div',
      attrs: {
        className: config.horizontal.getOffsetClassName()
      },
      children: children
    };
  }

  return getFormGroup({
    hasError: locals.hasError,
    children: children
  });
}

function select(locals) {

  var config = new SelectConfig(locals.config || {});

  var options = locals.options.map(function (x) {
    return skin.Option.is(x) ? uform.getOption(x) : uform.getOptGroup(x);
  });

  function onChange(evt) {
    var value = locals.multiple ?
      evt.target.options.filter(function (option) {
        return option.selected;
      }).map(function (option) {
        return option.value;
      }) :
      evt.target.value;
    locals.onChange(value);
  }

  var control = uform.getSelect({
    autoFocus: locals.autoFocus,
    value: locals.value,
    disabled: locals.disabled,
    'aria-describedby': locals.help ? locals.id + '-tip' : null,
    id: locals.label ? locals.id : null,
    name: locals.name,
    onChange: onChange,
    options: options,
    size: config.size,
    multiple: locals.multiple
  });

  var horizontal = config.horizontal;
  var label = getLabel({
    label: locals.label,
    htmlFor: locals.id,
    breakpoints: config.horizontal
  });
  var error = getError(locals);
  var help = getHelp(locals);
  var children = [
    label,
    control,
    error,
    help
  ];

  if (horizontal) {
    children = [
      label,
      {
        tag: 'div',
        attrs: {
          className: label ? horizontal.getInputClassName() : horizontal.getOffsetClassName()
        },
        children: [
          control,
          error,
          help
        ]
      }
    ];
  }

  return getFormGroup({
    hasError: locals.hasError,
    children: children
  });
}

function radio(locals) {

  var config = new RadioConfig(locals.config || {});

  var control = locals.options.map(function (option, i) {
    return uform.getRadio({
      autoFocus: locals.autoFocus && (i === 0),
      'aria-describedby': locals.label ? locals.id : null,
      id: locals.id + '-' + option.value,
      checked: (option.value === locals.value),
      disabled: option.disabled || locals.disabled,
      label: option.text,
      name: locals.name,
      onChange: function (evt) {
        locals.onChange(evt.target.value);
      },
      value: option.value
    });
  });

  var horizontal = config.horizontal;
  var label = getLabel({
    label: locals.label,
    id: locals.id,
    breakpoints: config.horizontal
  });
  var error = getError(locals);
  var help = getHelp(locals);
  var children = [
    label,
    control,
    error,
    help
  ];

  if (horizontal) {
    children = [
      label,
      {
        tag: 'div',
        attrs: {
          className: label ? horizontal.getInputClassName() : horizontal.getOffsetClassName()
        },
        children: [
          control,
          error,
          help
        ]
      }
    ];
  }

  return getFormGroup({
    hasError: locals.hasError,
    children: children
  });
}

function struct(locals) {

  var config = new StructConfig(locals.config || {});

  var rows = [];

  if (locals.help) {
    rows.push(getAlert({
      children: locals.help
    }));
  }

  rows = rows.concat(locals.order.map(function (name) {
    return locals.inputs.hasOwnProperty(name) ? locals.inputs[name] : name;
  }));

  if (locals.error && locals.hasError) {
    rows.push(getAlert({
      type: 'danger',
      children: locals.error
    }));
  }

  return getFormGroup({
    children: getFieldset({
      className: config.horizontal && config.horizontal.getFieldsetClassName(),
      disabled: locals.disabled,
      legend: locals.legend,
      children: rows
    })
  });
}

function list(locals) {

  var config = new ListConfig(locals.config || {});

  var rows = [];

  if (locals.help) {
    rows.push(getAlert({
      children: locals.help
    }));
  }

  rows = rows.concat(locals.items.map(function (item) {
    if (item.buttons.length === 0) {
      return uform.getRow({
        key: item.key,
        children: [
          getCol({
            breakpoints: {xs: 12},
            children: item.input
          })
        ]
      });
    }
    return uform.getRow({
      key: item.key,
      children: [
        getCol({
          breakpoints: {sm: 8, xs: 6},
          children: item.input
        }),
        getCol({
          breakpoints: {sm: 4, xs: 6},
          children: uform.getButtonGroup(item.buttons.map(function (button, i) {
            return getButton({
              click: button.click,
              key: i,
              label: button.label
            });
          }))
        })
      ]
    });
  }));

  if (locals.error && locals.hasError) {
    rows.push(getAlert({
      type: 'danger',
      children: locals.error
    }));
  }

  if (locals.add) {
    rows.push(getButton(locals.add));
  }

  return getFormGroup({
    children: getFieldset({
      className: config.horizontal && config.horizontal.getFieldsetClassName(),
      disabled: locals.disabled,
      legend: locals.legend,
      children: rows
    })
  });
}

module.exports = {
  name: 'bootstrap',
  textbox: textbox,
  checkbox: checkbox,
  select: select,
  radio: radio,
  struct: struct,
  list: list
};
},{"../../skin":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/skin.js","tcomb-validation":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/index.js","uvdom-bootstrap/form":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/form.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/getError.js":[function(require,module,exports){
'use strict';

var t = require('tcomb-validation');

function getError(error, value) {
  return t.Func.is(error) ? error(value) : error;
}

module.exports = getError;
},{"tcomb-validation":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/index.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/getOptionsOfEnum.js":[function(require,module,exports){
'use strict';

function getOptionsOfEnum(type) {
  var enums = type.meta.map;
  return Object.keys(enums).map(function (k) {
    return {
      value: k,
      text: enums[k]
    };
  });
}

module.exports = getOptionsOfEnum;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/getReport.js":[function(require,module,exports){
'use strict';

function getReport(type) {

  var innerType = type;
  var maybe = false;
  var subtype = false;
  var kind;

  while (true) {
    kind = innerType.meta.kind;
    if (kind === 'maybe') {
      maybe = true;
      innerType = innerType.meta.type;
      continue;
    }
    if (kind === 'subtype') {
      subtype = true;
      innerType = innerType.meta.type;
      continue;
    }
    break;
  }

  return {
    type: type,
    maybe: maybe,
    subtype: subtype,
    innerType: innerType
  };
}

module.exports = getReport;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/humanize.js":[function(require,module,exports){
'use strict';

// thanks to https://github.com/epeli/underscore.string

function underscored(s){
  return s.trim().replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
}

function capitalize(s){
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function humanize(s){
  return capitalize(underscored(s).replace(/_id$/,'').replace(/_/g, ' '));
}

module.exports = humanize;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/merge.js":[function(require,module,exports){
'use strict';

var t = require('tcomb-validation');
var mixin = t.mixin;

function merge(a, b) {
  return mixin(mixin({}, a), b, true);
}

module.exports = merge;
},{"tcomb-validation":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/index.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/move.js":[function(require,module,exports){
'use strict';

function move(arr, fromIndex, toIndex) {
  var element = arr.splice(fromIndex, 1)[0];
  arr.splice(toIndex, 0, element);
  return arr;
}

module.exports = move;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/lib/util/uuid.js":[function(require,module,exports){
'use strict';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = (c === 'x') ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

module.exports = uuid;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/debug/browser.js":[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Use chrome.storage.local if we are in an app
 */

var storage;

if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined')
  storage = chrome.storage.local;
else
  storage = window.localStorage;

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      storage.removeItem('debug');
    } else {
      storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = storage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

},{"./debug":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/debug/debug.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/debug/debug.js":[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/debug/node_modules/ms/index.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/debug/node_modules/ms/index.js":[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  var match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 's':
      return n * s;
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/form.js":[function(require,module,exports){
module.exports = {
  getAddon: require('./lib/getAddon'),
  getAlert: require('./lib/getAlert'),
  getBreakpoints: require('./lib/getBreakpoints'),
  getButton: require('./lib/getButton'),
  getButtonGroup: require('./lib/getButtonGroup'),
  getCheckbox: require('./lib/getCheckbox'),
  getCol: require('./lib/getCol'),
  getErrorBlock: require('./lib/getErrorBlock'),
  getFieldset: require('./lib/getFieldset'),
  getFormGroup: require('./lib/getFormGroup'),
  getHelpBlock: require('./lib/getHelpBlock'),
  getInputGroup: require('./lib/getInputGroup'),
  getLabel: require('./lib/getLabel'),
  getOffsets: require('./lib/getOffsets'),
  getOptGroup: require('./lib/getOptGroup'),
  getOption: require('./lib/getOption'),
  getRadio: require('./lib/getRadio'),
  getRow: require('./lib/getRow'),
  getSelect: require('./lib/getSelect'),
  getStatic: require('./lib/getStatic'),
  getTextbox: require('./lib/getTextbox')
};
},{"./lib/getAddon":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getAddon.js","./lib/getAlert":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getAlert.js","./lib/getBreakpoints":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getBreakpoints.js","./lib/getButton":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getButton.js","./lib/getButtonGroup":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getButtonGroup.js","./lib/getCheckbox":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getCheckbox.js","./lib/getCol":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getCol.js","./lib/getErrorBlock":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getErrorBlock.js","./lib/getFieldset":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getFieldset.js","./lib/getFormGroup":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getFormGroup.js","./lib/getHelpBlock":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getHelpBlock.js","./lib/getInputGroup":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getInputGroup.js","./lib/getLabel":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getLabel.js","./lib/getOffsets":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getOffsets.js","./lib/getOptGroup":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getOptGroup.js","./lib/getOption":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getOption.js","./lib/getRadio":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getRadio.js","./lib/getRow":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getRow.js","./lib/getSelect":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getSelect.js","./lib/getStatic":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getStatic.js","./lib/getTextbox":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getTextbox.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getAddon.js":[function(require,module,exports){
'use strict';

function getAddon(addon) {
  return {
    tag: 'span',
    attrs: {
      className: {
        'input-group-addon': true
      }
    },
    children: addon
  };
}

module.exports = getAddon;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getAlert.js":[function(require,module,exports){
'use strict';

function getAlert(opts) {

  var type = opts.type || 'info';
  var className = {
    'alert': true
  };
  className['alert-' + type] = true;

  return {
    tag: 'div',
    attrs: {
      className: className
    },
    children: opts.children
  };
}

module.exports = getAlert;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getBreakpoints.js":[function(require,module,exports){
'use strict';

function getBreakpoints(breakpoints) {
  var className = {};
  for (var size in breakpoints) {
    if (breakpoints.hasOwnProperty(size)) {
      className['col-' + size + '-' + breakpoints[size]] = true;
    }
  }
  return className;
}

module.exports = getBreakpoints;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getButton.js":[function(require,module,exports){
'use strict';

/*

  Example:

  {
    type: 'primary',
    block: true,
    active: true,
    size: 'lg',
    disabled: true,
    autoFocus: true,
    events: {
      ...
    }
  }

*/

function getButton(opts) {

  var type = opts.type || 'default';

  var className = {
    'btn': true,
    'btn-block': opts.block,
    'active': opts.active
  };
  className['btn-' + type] = true;
  if (opts.size) {
    className['btn-' + opts.size] = true;
  }

  var events = opts.events || {
    click: opts.click
  };

  return {
    tag: 'button',
    attrs: {
      disabled: opts.disabled,
      className: className,
      autoFocus: opts.autoFocus
    },
    events: events,
    children: opts.label,
    key: opts.key
  }
}

module.exports = getButton;

},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getButtonGroup.js":[function(require,module,exports){
'use strict';

function getButtonGroup(buttons) {
  return {
    tag: 'div',
    attrs: {
      className: {
        'btn-group': true
      }
    },
    children: buttons
  };
};

module.exports = getButtonGroup;


},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getCheckbox.js":[function(require,module,exports){
'use strict';

/*

  Example:

  {
    label: 'Remember me',
    defaultChecked: true,
    checked: true,
    name: 'rememberMe',
    disabled: false,
    events: {
      ...
    },
    autoFocus: true
  }

*/

function getCheckbox(opts) {

  var events = opts.events || {
    change: opts.onChange
  };

  return {
    tag: 'div',
    attrs: {
      className: {
        'checkbox': true,
        'disabled': opts.disabled
      }
    },
    children: {
      tag: 'label',
      attrs: {
        htmlFor: opts.id
      },
      children: [
        {
          tag: 'input',
          attrs: {
            checked: opts.checked,
            disabled: opts.disabled,
            id: opts.id,
            name: opts.name,
            type: 'checkbox',
            autoFocus: opts.autoFocus
          },
          events: events
        },
        ' ',
        opts.label
      ]
    }
  }
}

module.exports = getCheckbox;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getCol.js":[function(require,module,exports){
'use strict';

var getBreakpoints = require('./getBreakpoints');

function getCol(opts) {

  var className = opts.breakpoints ? getBreakpoints(opts.breakpoints) : null;

  return {
    tag: 'div',
    attrs: {
      className: className
    },
    children: opts.children
  };
}

module.exports = getCol;
},{"./getBreakpoints":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getBreakpoints.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getErrorBlock.js":[function(require,module,exports){
'use strict';

function getErrorBlock(opts) {
  return {
    tag: 'span',
    attrs: {
      className: {
        'help-block': true,
        'error-block': opts.hasError
      }
    },
    children: opts.error
  };
}

module.exports = getErrorBlock;


},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getFieldset.js":[function(require,module,exports){
'use strict';

function getFieldset(opts) {

  var children = opts.children.slice();

  if (opts.legend) {
    children.unshift({
      tag: 'legend',
      children: opts.legend
    });
  }

  return {
    tag: 'fieldset',
    attrs: {
      className: opts.className,
      disabled: opts.disabled
    },
    children: children
  };
};

module.exports = getFieldset;


},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getFormGroup.js":[function(require,module,exports){
'use strict';

function getFormGroup(opts) {
  return {
    tag: 'div',
    attrs: {
      className: {
        'form-group': true,
        'has-error': opts.hasError
      }
    },
    children: opts.children
  };
}

module.exports = getFormGroup;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getHelpBlock.js":[function(require,module,exports){
'use strict';

/*

  Example:

  {
    help: 'my help',
    hasError: true,
    id: 'password-tip'
  }

*/

function getHelpBlock(opts) {
  return {
    tag: 'span',
    attrs: {
      className: {
        'help-block': true,
        'error-block': opts.hasError
      },
      // aria support
      id: opts.id,
      role: 'tooltip'
    },
    children: opts.help
  };
}

module.exports = getHelpBlock;


},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getInputGroup.js":[function(require,module,exports){
'use strict';

function getInputGroup(children) {
  return {
    tag: 'div',
    attrs: {
      className: {
        'input-group': true
      }
    },
    children: children
  };
}

module.exports = getInputGroup;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getLabel.js":[function(require,module,exports){
'use strict';

var mixin = require('./mixin');

/*

  Example:

  {
    label: 'my label',
    htmlFor: 'inputId',
    id: 'myid',
    align: 'right',
    className: {}
  }

*/

function getLabel(opts) {

  var className = mixin({
    'control-label': true
  }, opts.className);

  if (opts.align) {
    className['text-' + opts.align] = true;
  }

  return {
    tag: 'label',
    attrs: {
      htmlFor: opts.htmlFor,
      id: opts.id,
      className: className
    },
    children: opts.label
  };
}

module.exports = getLabel;


},{"./mixin":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/mixin.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getOffsets.js":[function(require,module,exports){
'use strict';

function getOffsets(breakpoints) {
  var className = {};
  for (var size in breakpoints) {
    if (breakpoints.hasOwnProperty(size)) {
      className['col-' + size + '-offset-' + (12 - breakpoints[size])] = true;
    }
  }
  return className;
}

module.exports = getOffsets;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getOptGroup.js":[function(require,module,exports){
'use strict';

var getOption = require('./getOption');

/*

  Example:

  {
    label: 'group1',
    options: [
      {value: 'value1', text: 'description1'},
      {value: 'value3', text: 'description3'}
    ]
  }

*/

function getOptGroup(opts) {
  return {
    tag: 'optgroup',
    attrs: {
      disabled: opts.disabled,
      label: opts.label
    },
    children: opts.options.map(getOption),
    key: opts.label
  };
}

module.exports = getOptGroup;


},{"./getOption":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getOption.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getOption.js":[function(require,module,exports){
'use strict';

/*

  Example:

  {
    value: '1',
    text: 'option 1'
  }

*/

function getOption(opts) {
  return {
    tag: 'option',
    attrs: {
      disabled: opts.disabled,
      value: opts.value
    },
    children: opts.text,
    key: opts.value
  };
}

module.exports = getOption;


},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getRadio.js":[function(require,module,exports){
'use strict';

/*

  Example:

  {
    label: 'Option',
    defaultChecked: true,
    checked: true,
    value: '1',
    name: 'option',
    disabled: false,
    events: {
      ...
    },
    autoFocus: true
  }

*/

function getRadio(opts) {

  var events = opts.events || {
    change: opts.onChange
  };

  return {
    tag: 'div',
    attrs: {
      className: {
        'radio': true,
        'disabled': opts.disabled
      }
    },
    children: {
      tag: 'label',
      attrs: {
        htmlFor: opts.id,
      },
      children: [
        {
          tag: 'input',
          attrs: {
            type: 'radio',
            checked: opts.checked,
            defaultChecked: opts.defaultChecked,
            disabled: opts.disabled,
            name: opts.name,
            value: opts.value,
            id: opts.id,
            // aria support
            'aria-describedby': opts['aria-describedby'],
            autoFocus: opts.autoFocus
          },
          events: events
        },
        ' ',
        opts.label
      ]
    },
    key: opts.value
  };
}

module.exports = getRadio;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getRow.js":[function(require,module,exports){
'use strict';

function getRow(opts) {
  return {
    tag: 'div',
    attrs: {
      className: {
        'row': true
      }
    },
    children: opts.children,
    key: opts.key
  };
}

module.exports = getRow;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getSelect.js":[function(require,module,exports){
'use strict';

/*

  Example:

  {
    defaultValue: 'hello',
    value: 'hello',
    name: 'myname',
    disabled: false,
    size: 'lg',
    events: {
      ...
    },
    'aria-describedby': 'password-tip',
    autoFocus: false
  }

*/

function getSelect(opts) {

  var events = opts.events || {
    change: opts.onChange
  };

  var className = {
    'form-control': true
  };
  if (opts.size) {
    className['input-' + opts.size] = true;
  }

  return {
    tag: 'select',
    attrs: {
      name: opts.name,
      defaultValue: opts.defaultValue,
      value: opts.value,
      disabled: opts.disabled,
      className: className,
      multiple: opts.multiple,
      id: opts.id,
      // aria support
      'aria-describedby': opts['aria-describedby'],
      autoFocus: opts.autoFocus
    },
    children: opts.options,
    events: events
  };
}

module.exports = getSelect;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getStatic.js":[function(require,module,exports){
'use strict';

function getStatic(value) {
  return {
    tag: 'p',
    attrs: {
      className: {
        'form-control-static': true
      }
    },
    children: value
  };
}

module.exports = getStatic;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/getTextbox.js":[function(require,module,exports){
'use strict';

/*

  Example:

  {
    type: 'password',
    defaultValue: 'hello',
    value: 'hello',
    name: 'myname',
    disabled: false,
    placeholder: 'insert your name',
    readOnly: true,
    size: 'lg',
    events: {
      ...
    },
    'aria-describedby': 'password-tip',
    autoFocus: true
  }

*/

function getTextbox(opts) {

  var events = opts.events || {
    change: opts.onChange
  };

  var type = opts.type || 'text';
  var className = {
    'form-control': true
  };
  if (opts.size) {
    className['input-' + opts.size] = true;
  }

  return {
    tag: type === 'textarea' ? 'textarea' : 'input',
    attrs: {
      type: type === 'textarea' ? null : type,
      name: opts.name,
      defaultValue: opts.defaultValue,
      value: opts.value,
      disabled: opts.disabled,
      placeholder: opts.placeholder,
      readOnly: opts.readOnly,
      className: className,
      id: opts.id,
      'aria-describedby': opts['aria-describedby'],
      autoFocus: opts.autoFocus
    },
    events: events
  };
}

module.exports = getTextbox;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom-bootstrap/lib/mixin.js":[function(require,module,exports){
'use strict';

function mixin(a, b) {
  if (!b) { return a; }
  for (var k in b) {
    if (b.hasOwnProperty(k)) {
      a[k] = b[k];
    }
  }
  return a;
}

module.exports = mixin;
},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom/node_modules/react/lib/cx.js":[function(require,module,exports){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule cx
 */

/**
 * This function is used to mark string literals representing CSS class names
 * so that they can be transformed statically. This allows for modularization
 * and minification of CSS class names.
 *
 * In static_upstream, this function is actually implemented, but it should
 * eventually be replaced with something more descriptive, and the transform
 * that is used in the main stack should be ported for use elsewhere.
 *
 * @param string|object className to modularize, or an object of key/values.
 *                      In the object case, the values are conditions that
 *                      determine if the className keys should be included.
 * @param [string ...]  Variable list of classNames in the string case.
 * @return string       Renderable space-separated CSS className.
 */
function cx(classNames) {
  if (typeof classNames == 'object') {
    return Object.keys(classNames).filter(function(className) {
      return classNames[className];
    }).join(' ');
  } else {
    return Array.prototype.join.call(arguments, ' ');
  }
}

module.exports = cx;

},{}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom/react.js":[function(require,module,exports){
'use strict';

var React = require('react');
var cx = require('react/lib/cx');

// compile: x -> ReactElement
function compile(x) {

  // with host elements, compile behaves like the identity
  if (React.isValidElement(x)) {
    return x;
  }

  if (Array.isArray(x)) {
    return x.map(compile);
  }

  if (typeof x === 'object' && x !== null) {

    // attrs
    var attrs = mixin({}, x.attrs);
    if (attrs.className) {
      attrs.className = cx(attrs.className) || null; // avoid class=""
    }
    if (x.key != null) { attrs.key = x.key; }
    if (x.ref != null) { attrs.ref = x.ref; }

    // events
    if (x.events) {
      for (var name in x.events) {
        attrs[camelizeEvent(name)] = x.events[name];
      }
    }

    // children
    var children = compile(x.children);

    // build ReactElement
    return React.createElement.apply(React, [x.tag, attrs].concat(children));
  }

  return x;
}

//
// helpers
//

// transforms an event name to a React event name
// click -> onClick
// blur -> onBlur
function camelizeEvent(name) {
  return 'on' + name.charAt(0).toUpperCase() + name.substring(1);
}

function mixin(x, y) {
  if (!y) { return x; }
  for (var k in y) {
    if (y.hasOwnProperty(k)) {
      x[k] = y[k];
    }
  }
  return x;
}

module.exports = {
  compile: compile
};
},{"react":"react","react/lib/cx":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-form/node_modules/uvdom/node_modules/react/lib/cx.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/index.js":[function(require,module,exports){
(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define(['tcomb'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('tcomb'));
  } else {
    root.t = factory(root.t);
  }
}(this, function (t) {

  'use strict';

  var Any = t.Any;
  var Obj = t.Obj;
  var Str = t.Str;
  var Arr = t.Arr;
  var struct = t.struct;
  var list = t.list;
  var format = t.format;

  //
  // domain model
  //

  var ValidationError = struct({
    message: Str,
    actual: Any,
    expected: t.Type,
    path: list(t.union([Str, t.Num]))
  }, 'ValidationError');

  function getDefaultMessage(actual, expected, path) {
    return format('%s is `%j` should be a `%s`', '/' + path.join('/'), actual, expected.meta.name);
  }

  ValidationError.of = function of(actual, expected, path) {
    return new ValidationError({
      message: getDefaultMessage(actual, expected, path),
      actual: actual,
      expected: expected,
      path: path
    });
  };

  var ValidationResult = struct({
    errors: list(ValidationError),
    value: Any
  }, 'ValidationResult');

  ValidationResult.prototype.isValid = function isValid() {
    return !(this.errors.length);
  };

  ValidationResult.prototype.firstError = function firstError() {
    return this.isValid() ? null : this.errors[0];
  };

  ValidationResult.prototype.toString = function toString() {
    return this.isValid() ?
      format('[ValidationResult, true, %j]', this.value) :
      format('[ValidationResult, false, (%s)]', this.errors.map(function errorToString(err) {
        return err.message;
      }).join(', '));
  };

  //
  // validate
  //

  function validate(x, type) {
    return new ValidationResult(recurse(x, type, []));
  }

  function recurse(x, type, path) {
    return validators[type.meta.kind](x, type, path);
  }

  var validators = validate.validators = {};

  // irreducibles and enums
  validators.irreducible =
  validators.enums = function validateIrreducible(x, type, path) {
    return {
      value: x,
      errors: type.is(x) ? [] : [ValidationError.of(x, type, path)]
    };
  };

  validators.list = function validateList(x, type, path) {

    // x should be an array
    if (!Arr.is(x)) {
      return {value: x, errors: [ValidationError.of(x, type, path)]};
    }

    var ret = {value: [], errors: []};
    // every item should be of type `type.meta.type`
    for (var i = 0, len = x.length ; i < len ; i++ ) {
      var item = recurse(x[i], type.meta.type, path.concat(i));
      ret.value[i] = item.value;
      ret.errors = ret.errors.concat(item.errors);
    }
    return ret;
  };

  validators.subtype = function validateSubtype(x, type, path) {

    // x should be a valid inner type
    var ret = recurse(x, type.meta.type, path);
    if (ret.errors.length) {
      return ret;
    }

    // x should satisfy the predicate
    if (!type.meta.predicate(ret.value)) {
      ret.errors = [ValidationError.of(x, type, path)];
    }

    return ret;

  };

  validators.maybe = function validateMaybe(x, type, path) {
    return t.Nil.is(x) ?
      {value: null, errors: []} :
      recurse(x, type.meta.type, path);
  };

  validators.struct = function validateStruct(x, type, path) {

    // x should be an object
    if (!Obj.is(x)) {
      return {value: x, errors: [ValidationError.of(x, type, path)]};
    }

    // [optimization]
    if (type.is(x)) {
      return {value: x, errors: []};
    }

    var ret = {value: {}, errors: []};
    var props = type.meta.props;
    // every item should be of type `props[name]`
    for (var name in props) {
      if (props.hasOwnProperty(name)) {
        var prop = recurse(x[name], props[name], path.concat(name));
        ret.value[name] = prop.value;
        ret.errors = ret.errors.concat(prop.errors);
      }
    }
    if (!ret.errors.length) {
      ret.value = new type(ret.value);
    }
    return ret;
  };

  validators.tuple = function validateTuple(x, type, path) {

    var types = type.meta.types;
    var len = types.length;

    // x should be an array of at most `len` items
    if (!Arr.is(x) || x.length > len) {
      return {value: x, errors: [ValidationError.of(x, type, path)]};
    }

    var ret = {value: [], errors: []};
    // every item should be of type `types[i]`
    for (var i = 0 ; i < len ; i++ ) {
      var item = recurse(x[i], types[i], path.concat(i));
      ret.value[i] = item.value;
      ret.errors = ret.errors.concat(item.errors);
    }
    return ret;
  };

  validators.dict = function validateDict(x, type, path) {

    // x should be an object
    if (!Obj.is(x)) {
      return {value: x, errors: [ValidationError.of(x, type, path)]};
    }

    var ret = {value: {}, errors: []};
    // every key should be of type `domain`
    // every value should be of type `codomain`
    for (var k in x) {
      if (x.hasOwnProperty(k)) {
        path = path.concat(k);
        var key = recurse(k, type.meta.domain, path);
        var item = recurse(x[k], type.meta.codomain, path);
        ret.value[k] = item.value;
        ret.errors = ret.errors.concat(key.errors, item.errors);
      }
    }
    return ret;
  };

  validators.union = function validateUnion(x, type, path) {
    var ctor = type.dispatch(x);
    return t.Func.is(ctor)?
      recurse(x, ctor, path.concat(type.meta.types.indexOf(ctor))) :
      {value: x, errors: [ValidationError.of(x, type, path)]};
  };

  // exports
  t.mixin(t, {
    ValidationError: ValidationError,
    ValidationResult: ValidationResult,
    validate: validate
  });

  return t;

}));

},{"tcomb":"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/node_modules/tcomb/index.js"}],"/Users/giulio/Documents/Projects/github/tcomb-react/node_modules/tcomb-validation/node_modules/tcomb/index.js":[function(require,module,exports){
(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.t = factory();
  }
}(this, function () {

  'use strict';

  function fail(message) {
    // start debugger only once
    if (!fail.failed) {
      /*jshint debug: true*/
      debugger;
    }
    fail.failed = true;
    throw new TypeError(message);
  }

  function assert(guard, message) {
    if (guard !== true) {
      message = message ? format.apply(null, slice.call(arguments, 1)) : 'assert failed';
      exports.fail(message);
    }
  }

  //
  // utils
  //

  var slice = Array.prototype.slice;

  function mixin(target, source, overwrite) {
    if (Nil.is(source)) { return target; }
    for (var k in source) {
      if (source.hasOwnProperty(k)) {
        if (overwrite !== true) {
          assert(!target.hasOwnProperty(k), 'Cannot overwrite property %s', k);
        }
        target[k] = source[k];
      }
    }
    return target;
  }

  function format() {
    var args = slice.call(arguments);
    var len = args.length;
    var i = 1;
    var message = args[0];

    function formatArgument(match, type) {
      if (match === '%%') { return '%'; }       // handle escaping %
      if (i >= len) { return match; }           // handle less arguments than placeholders
      var formatter = format.formatters[type];
      if (!formatter) { return match; }         // handle undefined formatters
      return formatter(args[i++]);
    }

    var str = message.replace(/%([a-z%])/g, formatArgument);
    if (i < len) {
      str += ' ' + args.slice(i).join(' ');     // handle more arguments than placeholders
    }
    return str;
  }

  function getFunctionName(f) {
    assert(typeof f === 'function', 'Invalid argument `f` = `%s` supplied to `getFunctionName()`', f);
    return f.displayName || f.name || format('<function%s>', f.length);
  }

  function replacer(key, value) {
    return Func.is(value) ? getFunctionName(value) : value;
  }

  format.formatters = {
    s: function (x) { return String(x); },
    j: function (x) {
      try { // handle circular references
        return JSON.stringify(x, replacer);
      } catch (e) {
        return String(x);
      }
    }
  };

  function getTypeName(type) {
    assert(Type.is(type), 'Invalid argument `type` = `%s` supplied to `getTypeName()`', type);
    return type.meta.name;
  }

  function blockNew(x, type) {
    assert(!(x instanceof type), 'Operator `new` is forbidden for type `%s`', getTypeName(type));
  }

  function shallowCopy(x) {
    return Arr.is(x) ? x.concat() : Obj.is(x) ? mixin({}, x) : x;
  }

  function update(instance, spec) {
    assert(Obj.is(spec));
    var value = shallowCopy(instance);
    for (var k in spec) {
      if (spec.hasOwnProperty(k)) {
        if (update.commands.hasOwnProperty(k)) {
          assert(Object.keys(spec).length === 1);
          return update.commands[k](spec[k], value);
        } else {
          value[k] = update(value[k], spec[k]);
        }
      }
    }
    return value;
  }

  update.commands = {
    '$apply': function (f, value) {
      assert(Func.is(f));
      return f(value);
    },
    '$push': function (elements, arr) {
      assert(Arr.is(elements));
      assert(Arr.is(arr));
      return arr.concat(elements);
    },
    '$remove': function (keys, obj) {
      assert(Arr.is(keys));
      assert(Obj.is(obj));
      for (var i = 0, len = keys.length ; i < len ; i++ ) {
        delete obj[keys[i]];
      }
      return obj;
    },
    '$set': function (value) {
      return value;
    },
    '$splice': function (splices, arr) {
      assert(list(Arr).is(splices));
      assert(Arr.is(arr));
      return splices.reduce(function (acc, splice) {
        acc.splice.apply(acc, splice);
        return acc;
      }, arr);
    },
    '$swap': function (config, arr) {
      assert(Obj.is(config));
      assert(Num.is(config.from));
      assert(Num.is(config.to));
      assert(Arr.is(arr));
      var element = arr[config.to];
      arr[config.to] = arr[config.from];
      arr[config.from] = element;
      return arr;
    },
    '$unshift': function (elements, arr) {
      assert(Arr.is(elements));
      assert(Arr.is(arr));
      return elements.concat(arr);
    },
    '$merge': function (obj, value) {
      return mixin(mixin({}, value), obj, true);
    }
  };

  //
  // irreducibles
  //

  function irreducible(name, is) {

    assert(typeof name === 'string', 'Invalid argument `name` = `%s` supplied to `irreducible()`', name);
    assert(typeof is === 'function', 'Invalid argument `is` = `%s` supplied to `irreducible()`', is);

    function Irreducible(value) {
      blockNew(this, Irreducible);
      assert(is(value), 'Invalid argument `value` = `%s` supplied to irreducible type `%s`', value, name);
      return value;
    }

    Irreducible.meta = {
      kind: 'irreducible',
      name: name
    };

    Irreducible.displayName = name;

    Irreducible.is = is;

    return Irreducible;
  }

  var Any = irreducible('Any', function () {
    return true;
  });

  var Nil = irreducible('Nil', function (x) {
    return x === null || x === void 0;
  });

  var Str = irreducible('Str', function (x) {
    return typeof x === 'string';
  });

  var Num = irreducible('Num', function (x) {
    return typeof x === 'number' && isFinite(x) && !isNaN(x);
  });

  var Bool = irreducible('Bool', function (x) {
    return x === true || x === false;
  });

  var Arr = irreducible('Arr', function (x) {
    return x instanceof Array;
  });

  var Obj = irreducible('Obj', function (x) {
    return !Nil.is(x) && typeof x === 'object' && !Arr.is(x);
  });

  var Func = irreducible('Func', function (x) {
    return typeof x === 'function';
  });

  var Err = irreducible('Err', function (x) {
    return x instanceof Error;
  });

  var Re = irreducible('Re', function (x) {
    return x instanceof RegExp;
  });

  var Dat = irreducible('Dat', function (x) {
    return x instanceof Date;
  });

  var Type = irreducible('Type', function (x) {
    return Func.is(x) && Obj.is(x.meta);
  });

  function struct(props, name) {

    assert(dict(Str, Type).is(props), 'Invalid argument `props` = `%s` supplied to `struct` combinator', props);
    assert(maybe(Str).is(name), 'Invalid argument `name` = `%s` supplied to `struct` combinator', name);
    name = name || format('{%s}', Object.keys(props).map(function (prop) {
      return format('%s: %s', prop, getTypeName(props[prop]));
    }).join(', '));

    function Struct(value, mut) {
      // makes Struct idempotent
      if (Struct.is(value)) {
        return value;
      }
      assert(Obj.is(value), 'Invalid argument `value` = `%s` supplied to struct type `%s`', value, name);
      // makes `new` optional
      if (!(this instanceof Struct)) {
        return new Struct(value, mut);
      }
      for (var k in props) {
        if (props.hasOwnProperty(k)) {
          var expected = props[k];
          var actual = value[k];
          this[k] = expected(actual, mut);
        }
      }
      if (mut !== true) {
        Object.freeze(this);
      }
    }

    Struct.meta = {
      kind: 'struct',
      props: props,
      name: name
    };

    Struct.displayName = name;

    Struct.is = function (x) {
      return x instanceof Struct;
    };

    Struct.update = function (instance, spec) {
      return new Struct(exports.update(instance, spec));
    };

    Struct.extend = function (arr, name) {
      arr = [].concat(arr).map(function (x) {
        return Obj.is(x) ? x : x.meta.props;
      });
      arr.unshift(props);
      var ret = struct(arr.reduce(mixin, {}), name);
      mixin(ret.prototype, Struct.prototype); // prototypal inheritance
      return ret;
    };

    return Struct;
  }

  function union(types, name) {

    assert(list(Type).is(types), 'Invalid argument `types` = `%s` supplied to `union` combinator', types);
    var len = types.length;
    var defaultName = types.map(getTypeName).join(' | ');
    assert(len >= 2, 'Invalid argument `types` = `%s` supplied to `union` combinator, provide at least two types', defaultName);
    assert(maybe(Str).is(name), 'Invalid argument `name` = `%s` supplied to `union` combinator', name);
    name = name || defaultName;

    function Union(value, mut) {
      blockNew(this, Union);
      assert(Func.is(Union.dispatch), 'Unimplemented `dispatch()` function for union type `%s`', name);
      var type = Union.dispatch(value);
      assert(Type.is(type), 'The `dispatch()` function of union type `%s` returns no type constructor', name);
      return type(value, mut);
    }

    Union.meta = {
      kind: 'union',
      types: types,
      name: name
    };

    Union.displayName = name;

    Union.is = function (x) {
      return types.some(function (type) {
        return type.is(x);
      });
    };

    // default dispatch implementation
    Union.dispatch = function (x) {
      for (var i = 0 ; i < len ; i++ ) {
        if (types[i].is(x)) {
          return types[i];
        }
      }
    };

    return Union;
  }

  function maybe(type, name) {

    assert(Type.is(type), 'Invalid argument `type` = `%s` supplied to `maybe` combinator', type);
    // makes the combinator idempotent and handle Any, Nil
    if (type.meta.kind === 'maybe' || type === Any || type === Nil) {
      return type;
    }
    assert(Nil.is(name) || Str.is(name), 'Invalid argument `name` = `%s` supplied to `maybe` combinator', name);
    name = name || ('?' + getTypeName(type));

    function Maybe(value, mut) {
      blockNew(this, Maybe);
      return Nil.is(value) ? null : type(value, mut);
    }

    Maybe.meta = {
      kind: 'maybe',
      type: type,
      name: name
    };

    Maybe.displayName = name;

    Maybe.is = function (x) {
      return Nil.is(x) || type.is(x);
    };

    return Maybe;
  }

  function enums(map, name) {

    assert(Obj.is(map), 'Invalid argument `map` = `%s` supplied to `enums` combinator', map);
    assert(maybe(Str).is(name), 'Invalid argument `name` = `%s` supplied to `enums` combinator', name);
    var keys = Object.keys(map); // cache enums
    name = name || keys.map(function (k) { return JSON.stringify(k); }).join(' | ');

    function Enums(value) {
      blockNew(this, Enums);
      assert(Enums.is(value), 'Invalid argument `value` = `%s` supplied to enums type `%s`, expected one of %j', value, name, keys);
      return value;
    }

    Enums.meta = {
      kind: 'enums',
      map: map,
      name: name
    };

    Enums.displayName = name;

    Enums.is = function (x) {
      return Str.is(x) && map.hasOwnProperty(x);
    };

    return Enums;
  }

  enums.of = function (keys, name) {
    keys = Str.is(keys) ? keys.split(' ') : keys;
    var value = {};
    keys.forEach(function (k) {
      value[k] = k;
    });
    return enums(value, name);
  };

  function tuple(types, name) {

    assert(list(Type).is(types), 'Invalid argument `types` = `%s` supplied to `tuple` combinator', types);
    var len = types.length; // cache types length
    assert(maybe(Str).is(name), 'Invalid argument `name` = `%s` supplied to `tuple` combinator', name);
    name = name || format('[%s]', types.map(getTypeName).join(', '));

    function isTuple(x) {
      return types.every(function (type, i) {
        return type.is(x[i]);
      });
    }

    function Tuple(value, mut) {
      assert(Arr.is(value) && value.length === len, 'Invalid argument `value` = `%s` supplied to tuple type `%s`, expected an `Arr` of length `%s`', value, name, len);
      var frozen = (mut !== true);
      // makes Tuple idempotent
      if (isTuple(value) && Object.isFrozen(value) === frozen) {
        return value;
      }
      var arr = [];
      for (var i = 0 ; i < len ; i++) {
        var expected = types[i];
        var actual = value[i];
        arr.push(expected(actual, mut));
      }
      if (frozen) {
        Object.freeze(arr);
      }
      return arr;
    }

    Tuple.meta = {
      kind: 'tuple',
      types: types,
      length: len,
      name: name
    };

    Tuple.displayName = name;

    Tuple.is = function (x) {
      return Arr.is(x) && x.length === len && isTuple(x);
    };

    Tuple.update = function (instance, spec) {
      return Tuple(exports.update(instance, spec));
    };

    return Tuple;
  }

  function subtype(type, predicate, name) {

    assert(Type.is(type), 'Invalid argument `type` = `%s` supplied to `subtype` combinator', type);
    assert(Func.is(predicate), 'Invalid argument `predicate` = `%s` supplied to `subtype` combinator', predicate);
    assert(maybe(Str).is(name), 'Invalid argument `name` = `%s` supplied to `subtype` combinator', name);
    name = name || format('{%s | %s}', getTypeName(type), getFunctionName(predicate));

    function Subtype(value, mut) {
      blockNew(this, Subtype);
      var x = type(value, mut);
      assert(predicate(x), 'Invalid argument `value` = `%s` supplied to subtype type `%s`', value, name);
      return x;
    }

    Subtype.meta = {
      kind: 'subtype',
      type: type,
      predicate: predicate,
      name: name
    };

    Subtype.displayName = name;

    Subtype.is = function (x) {
      return type.is(x) && predicate(x);
    };

    Subtype.update = function (instance, spec) {
      return Subtype(exports.update(instance, spec));
    };

    return Subtype;
  }

  function list(type, name) {

    assert(Type.is(type), 'Invalid argument `type` = `%s` supplied to `list` combinator', type);
    assert(maybe(Str).is(name), 'Invalid argument `name` = `%s` supplied to `list` combinator', name);
    name = name || format('Array<%s>', getTypeName(type));

    function isList(x) {
      return x.every(type.is);
    }

    function List(value, mut) {
      assert(Arr.is(value), 'Invalid argument `value` = `%s` supplied to list type `%s`', value, name);
      var frozen = (mut !== true);
      // makes List idempotent
      if (isList(value) && Object.isFrozen(value) === frozen) {
        return value;
      }
      var arr = [];
      for (var i = 0, len = value.length ; i < len ; i++ ) {
        var actual = value[i];
        arr.push(type(actual, mut));
      }
      if (frozen) {
        Object.freeze(arr);
      }
      return arr;
    }

    List.meta = {
      kind: 'list',
      type: type,
      name: name
    };

    List.displayName = name;

    List.is = function (x) {
      return Arr.is(x) && isList(x);
    };

    List.update = function (instance, spec) {
      return List(exports.update(instance, spec));
    };

    return List;
  }

  function dict(domain, codomain, name) {

    assert(Type.is(domain), 'Invalid argument `domain` = `%s` supplied to `dict` combinator', domain);
    assert(Type.is(codomain), 'Invalid argument `codomain` = `%s` supplied to `dict` combinator', codomain);
    assert(maybe(Str).is(name), 'Invalid argument `name` = `%s` supplied to `dict` combinator', name);
    name = name || format('{[key:%s]: %s}', getTypeName(domain), getTypeName(codomain));

    function isDict(x) {
      for (var k in x) {
        if (x.hasOwnProperty(k)) {
          if (!domain.is(k) || !codomain.is(x[k])) { return false; }
        }
      }
      return true;
    }

    function Dict(value, mut) {
      assert(Obj.is(value), 'Invalid argument `value` = `%s` supplied to dict type `%s`', value, name);
      var frozen = (mut !== true);
      // makes Dict idempotent
      if (isDict(value) && Object.isFrozen(value) === frozen) {
        return value;
      }
      var obj = {};
      for (var k in value) {
        if (value.hasOwnProperty(k)) {
          k = domain(k);
          var actual = value[k];
          obj[k] = codomain(actual, mut);
        }
      }
      if (frozen) {
        Object.freeze(obj);
      }
      return obj;
    }

    Dict.meta = {
      kind: 'dict',
      domain: domain,
      codomain: codomain,
      name: name
    };

    Dict.displayName = name;

    Dict.is = function (x) {
      return Obj.is(x) && isDict(x);
    };

    Dict.update = function (instance, spec) {
      return Dict(exports.update(instance, spec));
    };

    return Dict;
  }

  function isInstrumented(f) {
    return Func.is(f) && Obj.is(f.type);
  }

  function func(domain, codomain, name) {

    // handle handy syntax for unary functions
    domain = Arr.is(domain) ? domain : [domain];
    assert(list(Type).is(domain), 'Invalid argument `domain` = `%s` supplied to `func` combinator', domain);
    assert(Type.is(codomain), 'Invalid argument `codomain` = `%s` supplied to `func` combinator', codomain);
    assert(maybe(Str).is(name), 'Invalid argument `name` = `%s` supplied to `func` combinator', name);
    name = name || format('(%s) => %s', domain.map(getTypeName).join(', '), getTypeName(codomain));
    var domainLen = domain.length; // cache the domain length

    function Func(value) {
      // automatically instrument the function
      if (!isInstrumented(value)) {
        return Func.of(value);
      }
      assert(Func.is(value), 'Invalid argument `value` = `%s` supplied to func type `%s`', value, name);
      return value;
    }

    Func.meta = {
      kind: 'func',
      domain: domain,
      codomain: codomain,
      name: name
    };

    Func.displayName = name;

    Func.is = function (x) {
      return isInstrumented(x) &&
        x.type.domain.length === domainLen &&
        x.type.domain.every(function (type, i) {
          return type === domain[i];
        }) &&
        x.type.codomain === codomain;
    };

    Func.of = function (f) {

      assert(typeof f === 'function');

      // makes Func.of idempotent
      if (Func.is(f)) {
        return f;
      }

      function fn() {
        var args = slice.call(arguments);
        var len = args.length;
        var argsType = tuple(domain.slice(0, len));
        args = argsType(args);
        if (len === domainLen) {
          /* jshint validthis: true */
          return codomain(f.apply(this, args));
        } else {
          var curried = Function.prototype.bind.apply(f, [this].concat(args));
          var newdomain = func(domain.slice(len), codomain);
          return newdomain.of(curried);
        }
      }

      fn.type = {
        domain: domain,
        codomain: codomain,
        f: f
      };

      fn.displayName = getFunctionName(f);

      return fn;

    };

    return Func;

  }

  var exports = {
    format: format,
    getFunctionName: getFunctionName,
    getTypeName: getTypeName,
    mixin: mixin,
    slice: slice,
    shallowCopy: shallowCopy,
    update: update,
    assert: assert,
    fail: fail,
    Any: Any,
    Nil: Nil,
    Str: Str,
    Num: Num,
    Bool: Bool,
    Arr: Arr,
    Obj: Obj,
    Func: Func,
    Err: Err,
    Re: Re,
    Dat: Dat,
    Type: Type,
    irreducible: irreducible,
    struct: struct,
    enums: enums,
    union: union,
    maybe: maybe,
    tuple: tuple,
    subtype: subtype,
    list: list,
    dict: dict,
    func: func
  };

  return exports;

}));

},{}],"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/buffer/index.js":[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var kMaxLength = 0x3fffffff
var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Find the length
  var length
  if (type === 'number')
    length = subject > 0 ? subject >>> 0 : 0
  else if (type === 'string') {
    length = Buffer.byteLength(subject, encoding)
  } else if (type === 'object' && subject !== null) { // assume object is array-like
    if (subject.type === 'Buffer' && isArray(subject.data))
      subject = subject.data
    length = +subject.length > 0 ? Math.floor(+subject.length) : 0
  } else
    throw new TypeError('must start with number, buffer, array or string')

  if (length > kMaxLength)
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
      'size: 0x' + kMaxLength.toString(16) + ' bytes')

  var buf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer.TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++)
        buf[i] = subject.readUInt8(i)
    } else {
      for (i = 0; i < length; i++)
        buf[i] = ((subject[i] % 256) + 256) % 256
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer.TYPED_ARRAY_SUPPORT && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  if (length > 0 && length <= Buffer.poolSize)
    buf.parent = rootParent

  return buf
}

function SlowBuffer(subject, encoding, noZero) {
  if (!(this instanceof SlowBuffer))
    return new SlowBuffer(subject, encoding, noZero)

  var buf = new Buffer(subject, encoding, noZero)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b))
    throw new TypeError('Arguments must be Buffers')

  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function (list, totalLength) {
  if (!isArray(list)) throw new TypeError('Usage: Buffer.concat(list[, length])')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    case 'hex':
      ret = str.length >>> 1
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    default:
      ret = str.length
  }
  return ret
}

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function (encoding, start, end) {
  var loweredCase = false

  start = start >>> 0
  end = end === undefined || end === Infinity ? this.length : end >>> 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase)
          throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.equals = function (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max)
      str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b)
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(byte)) throw new Error('Invalid hex string')
    buf[offset + i] = byte
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length, 2)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0

  if (length < 0 || offset < 0 || offset > this.length)
    throw new RangeError('attempt to write outside buffer bounds');

  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new TypeError('Unknown encoding: ' + encoding)
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len;
    if (start < 0)
      start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0)
      end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start)
    end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length)
    newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0)
    throw new RangeError('offset is not uint')
  if (offset + ext > length)
    throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100))
    val += this[offset + i] * mul

  return val
}

Buffer.prototype.readUIntBE = function (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkOffset(offset, byteLength, this.length)

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100))
    val += this[offset + --byteLength] * mul;

  return val
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
}

Buffer.prototype.readIntLE = function (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100))
    val += this[offset + i] * mul
  mul *= 0x80

  if (val >= mul)
    val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100))
    val += this[offset + --i] * mul
  mul *= 0x80

  if (val >= mul)
    val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80))
    return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100))
    this[offset + i] = (value / mul) >>> 0 & 0xFF

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert)
    checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100))
    this[offset + i] = (value / mul) >>> 0 & 0xFF

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

Buffer.prototype.writeIntLE = function (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkInt(this,
             value,
             offset,
             byteLength,
             Math.pow(2, 8 * byteLength - 1) - 1,
             -Math.pow(2, 8 * byteLength - 1))
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100))
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkInt(this,
             value,
             offset,
             byteLength,
             Math.pow(2, 8 * byteLength - 1) - 1,
             -Math.pow(2, 8 * byteLength - 1))
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100))
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (target_start >= target.length) target_start = target.length
  if (!target_start) target_start = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || source.length === 0) return 0

  // Fatal error conditions
  if (target_start < 0)
    throw new RangeError('targetStart out of bounds')
  if (start < 0 || start >= source.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z\-]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes(string, units) {
  var codePoint, length = string.length
  var leadSurrogate = null
  units = units || Infinity
  var bytes = []
  var i = 0

  for (; i<length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {

      // last char was a lead
      if (leadSurrogate) {

        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          leadSurrogate = codePoint
          continue
        }

        // valid surrogate pair
        else {
          codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
          leadSurrogate = null
        }
      }

      // no lead yet
      else {

        // unexpected trail
        if (codePoint > 0xDBFF) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // unpaired lead
        else if (i + 1 === length) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        else {
          leadSurrogate = codePoint
          continue
        }
      }
    }

    // valid bmp char, but last char was a lead
    else if (leadSurrogate) {
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
      leadSurrogate = null
    }

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    }
    else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      );
    }
    else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    }
    else if (codePoint < 0x200000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    }
    else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {

    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length, unitSize) {
  if (unitSize) length -= length % unitSize;
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

},{"base64-js":"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js","ieee754":"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js","is-array":"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/buffer/node_modules/is-array/index.js"}],"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js":[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js":[function(require,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/buffer/node_modules/is-array/index.js":[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/path-browserify/index.js":[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/process/browser.js"}],"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/process/browser.js":[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},["/Users/giulio/Documents/Projects/github/tcomb-react/docs/demo/alert/src.js"]);