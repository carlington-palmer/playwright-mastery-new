Feature: Tasks

Background: 
    Given I am logged in as a standard user

Scenario: Create a new Task
    When I create a task called "Buy Milk"
    Then I should see "Buy Milk" in the tasks list


Scenario: New task start as todo
    When I create a task called "Coding Practice"
    Then the task "Coding Practice" should have status "To do" 