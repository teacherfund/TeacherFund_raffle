# How To Contribute

Welcome, and thank you for your interest in contributing to the TeacherFund Raffle Alexa skill!

There are many ways to contribute, beyond writing code. The goal of this document is to provide a high-level overview of how you can get involved.

## Reporting Issues
We want to hear about any problems with the website. Whether it be a functional issue (e.g. the alexa skill won't respond to a certain request), or just a suggestion to make things more maintainable, please log an issue in this repository.

### Look For an Existing Issue
Before you create a new issue, please do a search in [open issues](https://github.com/teacherfund/TeacherFund_raffle/issues) to see if the issue or feature request has already been filed.

If you find your issue already exists, make relevant comments and add your reaction. Use a reaction in place of a "+1" comment:

- 👍 - upvote
- 👎 - downvote

### Writing Good Bug Reports and Feature Requests
File a single issue per problem and feature request. Do not enumerate multiple bugs or feature requests in the same issue.

Do not add your issue as a comment to an existing issue unless it's for the identical input. Many issues look similar, but have different causes.

These would be very helpful to include:
- Reproducible steps (1... 2... 3...) that cause the issue
- What you expected to hear, versus what you actually heard
- Video or recording showing the issue occurring

## Writing Code
If you are interested in writing code to fix issues, read the below to understand our project structure and set up your development environment.

**In order to avoid duplicate work and to save you from wasting time, please comment in an open issue your intention to code out the resolution to that issue. If it isn't obvious how that issue will be solved, outline what you plan to do to make sure it's in line with the maintainers' vision for the project.**

The website is written in a javascript [Lambda](https://aws.amazon.com/lambda/) using [ask-sdk-core](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs/tree/2.0.x/ask-sdk-core). 

### Directory Structure
- **index.js**
  - _Main alexa skill intent handlers file_

### Local Development Environment
TODO

### Opening a Pull Request
Commit any code changes to a branch (e.g. `fix/header` or `feature/donate-form`).

When you've finished making changes and committed the changes into your branch, you can open a pull request. Please reference the issue you have solved in your pull request.

### Coding Standards

- Code should pass linting by [Standard](https://standardjs.com/). Run `npm run lint` to confirm there are no linting errors.
- Bugfixes should be accompanied by tests to avoid regression

## Thank You!
Your contributions to open source, large or small, make projects like this possible. Thank you for taking the time to contribute.
