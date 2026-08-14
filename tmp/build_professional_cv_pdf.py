from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, PageBreak, KeepTogether
from pathlib import Path

OUT = Path(r"C:\Users\sbhosale\OneDrive - Frontline\Documents\ChatGPT\AT-AI-Test-Automation\output\cv")
OUT.mkdir(parents=True, exist_ok=True)
PDF = OUT / "Sumit_Bhosale_Professional_CV.pdf"

NAVY = HexColor("#122D4A")
TEAL = HexColor("#00798C")
INK = HexColor("#1F2937")
MUTED = HexColor("#546274")
LINE = HexColor("#9BC2CC")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CVName", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=22, leading=23, textColor=NAVY, spaceAfter=2))
styles.add(ParagraphStyle(name="CVHeadline", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9.6, leading=12, textColor=TEAL, spaceAfter=4))
styles.add(ParagraphStyle(name="CVContact", parent=styles["Normal"], fontName="Helvetica", fontSize=8.7, leading=10.5, textColor=MUTED, spaceAfter=5))
styles.add(ParagraphStyle(name="CVSection", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10.6, leading=12, textColor=NAVY, spaceBefore=6, spaceAfter=2, keepWithNext=True))
styles.add(ParagraphStyle(name="CVBody", parent=styles["Normal"], fontName="Helvetica", fontSize=9.25, leading=12, textColor=INK, spaceAfter=3))
styles.add(ParagraphStyle(name="CVSkill", parent=styles["Normal"], fontName="Helvetica", fontSize=8.95, leading=11.25, textColor=INK, spaceAfter=1.8))
styles.add(ParagraphStyle(name="CVRole", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10.1, leading=12.2, textColor=NAVY, spaceBefore=5.5, spaceAfter=0.8, keepWithNext=True))
styles.add(ParagraphStyle(name="CVProject", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9.05, leading=11, textColor=INK, spaceAfter=0.8, keepWithNext=True))
styles.add(ParagraphStyle(name="CVMeta", parent=styles["Normal"], fontName="Helvetica-Oblique", fontSize=8.55, leading=10.4, textColor=MUTED, spaceAfter=2.8, keepWithNext=True))
styles.add(ParagraphStyle(name="CVBullet", parent=styles["Normal"], fontName="Helvetica", fontSize=8.85, leading=11.15, textColor=INK, leftIndent=12, firstLineIndent=-7, bulletIndent=2, spaceAfter=1.6))
styles.add(ParagraphStyle(name="CVFooter", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=7.2, leading=8, textColor=MUTED, alignment=TA_CENTER))

doc = SimpleDocTemplate(str(PDF), pagesize=letter, leftMargin=0.58*inch, rightMargin=0.58*inch, topMargin=0.45*inch, bottomMargin=0.46*inch, title="Sumit Bhosale - Senior Quality Analyst CV", author="Sumit Bhosale", subject="Quality Engineering and Test Automation")

def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(HexColor("#D8E2EC")); canvas.setLineWidth(0.5)
    canvas.line(doc.leftMargin, 0.34*inch, letter[0]-doc.rightMargin, 0.34*inch)
    canvas.setFont("Helvetica-Bold", 7.2); canvas.setFillColor(MUTED)
    canvas.drawCentredString(letter[0]/2, 0.2*inch, f"SUMIT BHOSALE  |  SENIOR QUALITY ANALYST  |  PAGE {doc.page}")
    canvas.restoreState()

story=[]
def section(title):
    story.append(Paragraph(title.upper(), styles["CVSection"]))
    story.append(HRFlowable(width="100%", thickness=0.8, color=LINE, spaceBefore=0, spaceAfter=3))
def bullet(text): story.append(Paragraph(text, styles["CVBullet"], bulletText="•"))
def role(role, company, project, dates, meta):
    story.append(Paragraph(f"{role}  <font color='#00798C'>|  {company}</font>", styles["CVRole"]))
    story.append(Paragraph(f"{project}  <font color='#546274'>|  {dates}</font>", styles["CVProject"]))
    story.append(Paragraph(meta, styles["CVMeta"]))

story += [
    Paragraph("SUMIT BHOSALE", styles["CVName"]),
    Paragraph("SENIOR QUALITY ANALYST  |  TEST AUTOMATION  |  API &amp; PERFORMANCE TESTING", styles["CVHeadline"]),
    Paragraph("Pune, India  |  +91 77419 00966  |  <link href='mailto:sumitbhosale0212@gmail.com' color='#00798C'><b>sumitbhosale0212@gmail.com</b></link>", styles["CVContact"]),
    HRFlowable(width="100%", thickness=1.2, color=LINE, spaceBefore=0, spaceAfter=3)
]

section("Professional Summary")
story.append(Paragraph("Quality engineering professional with 6+ years of experience delivering web, API, and performance testing across BFSI, investment banking, and healthcare. Hands-on expertise in Selenium WebDriver with Java, Cucumber BDD, TestNG, Rest Assured, Postman, Cypress, and JMeter. Experienced in building maintainable automation frameworks, validating complex trade and healthcare workflows, integrating test suites with CI/CD, and partnering with Agile teams to improve release confidence.", styles["CVBody"]))

section("Core Expertise")
for label, value in [
    ("Automation", "Selenium WebDriver, Java, TestNG, Cucumber BDD, Cypress, Page Object Model, data-driven and hybrid frameworks"),
    ("API &amp; Performance", "Rest Assured, Postman, JSON, POJO mapping, serialization/deserialization, JMeter, BlazeMeter"),
    ("CI/CD &amp; Tooling", "Git, GitHub, GitLab CI/CD, Jenkins, Maven, JIRA, Zephyr, Allure, Kibana, Sumo Logic, Sauce Labs"),
    ("Data &amp; Platforms", "SQL, PostgreSQL, MySQL, Windows, Linux, Apple iOS; IntelliJ IDEA, Eclipse, Visual Studio Code"),
    ("Quality Practices", "Functional, regression, sanity, retesting, API, database and performance testing; test planning, execution, traceability, defect reporting, Agile/Scrum")
]: story.append(Paragraph(f"<b><font color='#122D4A'>{label}:</font></b> {value}", styles["CVSkill"]))

section("Professional Experience")
role("Senior Quality Analyst", "Pyramid IT Consulting", "CHESS Replacement - Australian Securities Exchange (ASX)", "Dec 2024 - Jan 2026", "Domain: Banking, Financial Services and Insurance (BFSI)")
for x in [
    "Designed Cucumber BDD feature files and reusable step definitions to automate multiple end-to-end trade flows.",
    "Automated UI validation across TCS BaNCS screens using Selenium WebDriver, Java, and Cucumber BDD.",
    "Automated trade submission and verified acknowledgement receipts through the Quartz Gateway.",
    "Validated trade-capture reports and AR FIX messages for trade submission and cancellation scenarios.",
    "Built parameterized GitLab CI/CD pipelines using environment, trade date, and test-case inputs for flexible execution.",
    "Reviewed Cucumber HTML reports, investigated failures, and communicated actionable results to stakeholders."
]: bullet(x)

story.append(PageBreak())
section("Professional Experience - Continued")
role("Quality Analyst", "Endava Solution", "Health Connect 360 - Cigna, United States", "Dec 2021 - Dec 2024", "Domain: Healthcare | Pharmacy, medical, lab and member-engagement data workflows")
for x in [
    "Developed web and API automation using TestNG, Cucumber BDD, Rest Assured, and data-driven Postman collections.",
    "Created POJO models, test classes, and shared request/response specifications for maintainable API coverage.",
    "Used Allure reporting to capture request, response, and execution logs for faster failure analysis.",
    "Executed performance tests with JMeter, recorded flows with BlazeMeter, and maintained JMX test assets.",
    "Analyzed test failures using Kibana, Sumo Logic, and Sauce Labs; tracked defects and execution through Zephyr Squad.",
    "Prepared test reports and maintained feature files and step definitions aligned with functional specifications."
]: bullet(x)

role("Quality Analyst", "AdiSoft Technologies", "FNB - FirstRand Limited, South Africa", "Oct 2019 - Jun 2021", "Domain: Investment Banking")
for x in [
    "Reviewed requirements and technical designs, then created detailed test plans, test cases, and traceability coverage.",
    "Built Selenium WebDriver automation using Java, TestNG, Page Object Model, and Maven.",
    "Configured Jenkins jobs to run automated suites and supported repeatable regression execution.",
    "Performed functional, regression, retesting, system, and monthly JMeter performance testing.",
    "Managed defect tracking and reporting, mapped requirements to tests and defects, and participated in test-case reviews.",
    "Contributed to estimation, prioritization, planning, Scrum ceremonies, and continuous improvement of test strategy."
]: bullet(x)

section("Education & Professional Development")
story.append(Paragraph("<b><font color='#122D4A'>Bachelor of Engineering</font></b>  |  Savitribai Phule Pune University  |  2019", styles["CVBody"]))
story.append(Paragraph("<b><font color='#122D4A'>Professional coursework:</font></b> REST API Testing Automation; Selenium WebDriver with Java - Basic to Advanced and Frameworks", styles["CVBody"]))

doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
print(PDF)
