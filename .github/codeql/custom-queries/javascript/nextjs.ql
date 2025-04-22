/**
 * @name Next.js XSS Vulnerability
 * @description Detects potential XSS vulnerabilities in Next.js applications
 * @kind path-problem
 * @problem.severity error
 * @precision high
 * @id js/nextjs-xss-vulnerability
 * @tags security
 *       external/cwe/cwe-079
 */

import javascript
import DataFlow::PathGraph
import semmle.javascript.security.dataflow.DomBasedXssCustomizations

/**
 * NextJS-specific sources of user input that could lead to XSS
 */
class NextJsUserInputSource extends DomBasedXss::Source {
  NextJsUserInputSource() {
    // Detect useSearchParams().get() as a source of untrusted data
    exists(DataFlow::CallNode searchParamsCall, DataFlow::CallNode getCall |
      searchParamsCall.getCalleeName() = "useSearchParams" and
      getCall.getCalleeName() = "get" and
      getCall.getReceiver().getALocalSource() = searchParamsCall and
      this = getCall
    )
    or
    // Detect router.query access in useRouter()
    exists(DataFlow::CallNode routerCall |
      routerCall.getCalleeName() = "useRouter" and
      this = routerCall.getAPropertyRead("query").getAPropertyRead()
    )
    or
    // Detect params in route handlers
    exists(DataFlow::ParameterNode param |
      param.getName().regexpMatch("(?i).*(req|request|params|query).*") and
      this = param.getAPropertyRead()
    )
  }
}

/**
 * Next.js specific XSS sinks
 */
class NextJsXssSink extends DomBasedXss::Sink {
  NextJsXssSink() {
    // dangerouslySetInnerHTML in JSX
    exists(DataFlow::PropWrite propWrite |
      propWrite.getPropertyName() = "dangerouslySetInnerHTML" and
      this = propWrite.getRhs().getAPropertyWrite("__html").getRhs()
    )
    or
    // Direct DOM manipulation
    exists(DataFlow::PropWrite propWrite |
      propWrite.getPropertyName().regexpMatch("(?i)inner(HTML|Text)") and
      this = propWrite.getRhs()
    )
  }
}

/**
 * Track flow from NextJS user inputs to XSS sinks
 */
class NextJsXssConfiguration extends DomBasedXss::Configuration {
  NextJsXssConfiguration() { this = "NextJsXssConfiguration" }

  override predicate isSource(DataFlow::Node source) {
    super.isSource(source) or
    source instanceof NextJsUserInputSource
  }

  override predicate isSink(DataFlow::Node sink) {
    super.isSink(sink) or
    sink instanceof NextJsXssSink
  }

  override predicate isAdditionalFlowStep(DataFlow::Node pred, DataFlow::Node succ) {
    super.isAdditionalFlowStep(pred, succ)
    or
    // Handle template literals
    exists(StringOps::ConcatenationRoot concatRoot |
      pred = concatRoot.getALeaf() and
      succ = concatRoot
    )
    or
    // Handle object spread
    exists(ObjectExpr obj |
      pred = obj.getAProperty().getValue().flow() and
      succ = obj.flow()
    )
  }
}

// Use the configuration to identify XSS issues
from DataFlow::PathNode source, DataFlow::PathNode sink, NextJsXssConfiguration config
where config.hasFlowPath(source, sink)
select sink.getNode(), source, sink, "Possible XSS vulnerability due to $@.", source.getNode(),
  "user-provided value"
