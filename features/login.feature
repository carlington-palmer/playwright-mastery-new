Feature: Login

  Scenario: Standard user logs in
    Given I am on the login page
    When I log in as the standard user
    Then I should see the dashboard