import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.scraper import get_scraper


def should_write_result(crawl_status, include_non_success=False):
    return include_non_success or crawl_status == "success"


def scrape_url(url):
    scraper = get_scraper(url)
    return scraper.scrape(url)


def main():
    urls_file = "data/urls.txt"
    output_file = "data/dataset.jsonl"
    include_non_success = os.getenv("AI_BATCH_INCLUDE_NON_SUCCESS", "").lower() in {
        "1",
        "true",
        "yes",
    }

    if not os.path.exists(urls_file):
        print(f"Error: Cannot find {urls_file}")
        print("Create it and add one URL per line.")
        return

    with open(urls_file, "r", encoding="utf-8") as f:
        urls = [line.strip() for line in f if line.strip()]

    if not urls:
        print("URL list is empty. Nothing to do.")
        return

    print(f"Starting to scrape {len(urls)} URL(s)...")
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    success_count = 0
    skipped_count = 0
    failed_count = 0
    written_count = 0

    with open(output_file, "a", encoding="utf-8") as f_out:
        with ThreadPoolExecutor(max_workers=3) as executor:
            future_to_url = {executor.submit(scrape_url, url): url for url in urls}
            for future in as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    result = future.result()

                    if result.crawl_status == "success":
                        success_count += 1
                        print(f"[SUCCESS] {url}")
                    elif result.crawl_status == "skipped":
                        skipped_count += 1
                        print(f"[SKIPPED] {url} (Already in database)")
                    else:
                        failed_count += 1
                        print(f"[FAILED] {url} -> {result.description_text}")

                    if should_write_result(result.crawl_status, include_non_success):
                        f_out.write(result.model_dump_json() + "\n")
                        f_out.flush()
                        written_count += 1
                except Exception as exc:
                    failed_count += 1
                    print(f"[ERROR] {url} generated an exception: {exc}")

    print("\n" + "=" * 40)
    print("BATCH SCRAPING COMPLETED")
    print(f"Total URLs: {len(urls)}")
    print(f"Success:  {success_count}")
    print(f"Skipped:  {skipped_count}")
    print(f"Failed:   {failed_count}")
    print(f"Written:  {written_count}")
    print(f"Data saved to: {output_file}")
    print("=" * 40)


if __name__ == "__main__":
    main()
