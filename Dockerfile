FROM php:8.2-apache

# Instala curl
RUN apt-get update && apt-get install -y libcurl4-openssl-dev \
    && docker-php-ext-install curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Porta 8080
RUN sed -i 's/Listen 80$/Listen 8080/' /etc/apache2/ports.conf

# VirtualHost com AllowOverride All
RUN printf '<VirtualHost *:8080>\n\
    DocumentRoot /var/www/html\n\
    <Directory /var/www/html>\n\
        AllowOverride All\n\
        Require all granted\n\
    </Directory>\n\
</VirtualHost>\n' > /etc/apache2/sites-available/000-default.conf

# Copia os arquivos do projeto
COPY . /var/www/html/

# Permissões
RUN mkdir -p /var/www/html/api/logs/notified \
    && chown -R www-data:www-data /var/www/html/ \
    && chmod -R 755 /var/www/html/ \
    && chmod -R 775 /var/www/html/api/logs/

EXPOSE 8080

# Fix MPM no momento do start (não no build) — garante que nada re-habilita o mpm_event depois
CMD ["/bin/sh", "-c", "\
    rm -f /etc/apache2/mods-enabled/mpm_event.load \
          /etc/apache2/mods-enabled/mpm_event.conf \
          /etc/apache2/mods-enabled/mpm_worker.load \
          /etc/apache2/mods-enabled/mpm_worker.conf && \
    ln -sf /etc/apache2/mods-available/mpm_prefork.load /etc/apache2/mods-enabled/mpm_prefork.load && \
    ln -sf /etc/apache2/mods-available/mpm_prefork.conf /etc/apache2/mods-enabled/mpm_prefork.conf && \
    a2enmod rewrite && \
    apache2-foreground"]
